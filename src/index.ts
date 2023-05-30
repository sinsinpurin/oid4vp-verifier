import express from "express";
import QRCode from "qrcode";
import oid4vciConfig from "./.well-known/openid-credential-issuer.json";
import sample from "./.well-known/sample.json";
import dotenv from "dotenv";
import { auth } from "express-oauth2-jwt-bearer";
import { verifyToken, getDid } from "./jwt/verify";
import fetch from "node-fetch";
import jsonpath from "jsonpath";
import BlockBasePD from "./presentation_definition/BlockBaseVC.json";
import { createPresentationDefinition } from "./presentationDef";
import { getSession } from "./session";
import { verifyVC, exampleVC } from "./verify/jsonld";

dotenv.config();

const app = express();

app.use(express.json());

const presentaiotinDefinition: any = {
    blockbase_presentation: BlockBasePD,
};

app.get("/", async (_, res) => {
    // const result = await verifyVC(exampleVC)
    //     .then((verified: any) => {
    //         console.log("Verified:", verified);
    //     })
    //     .catch((error: any) => {
    //         console.error("Error verifying VC:", error);
    //     });
    // console.log(result);
    res.send("Hello world");
});

/**
 * This endpoint shows QR code
 * 
 * ex)
 * https://wallet.example.com?
    client_id=https%3A%2F%2Fclient.example.org%2Fcb
    &request_uri=https%3A%2F%2Fclient.example.org%2F567545564
 * custom url scheme: openid4vp://
 */
app.get("/qr", async (_, res) => {
    try {
        const clientId = `${process.env.VERIFIER_DOMAIN}`;
        const requestUri = `${process.env.VERIFIER_DOMAIN}/presentationRequest/blockbase_presentation`;

        const url = `openid4vp://?client_id=${encodeURIComponent(
            clientId,
        )}&request_uri=${encodeURIComponent(requestUri)}`;

        if (!url) {
            return res.status(400).send("URL query parameter is required");
        }
        console.log(url); //openid4vp://?client_id=http%3A%2F%2Flocalhost%3A8000&request_uri=http%3A%2F%2Flocalhost%3A8000%2FpresentationRequest%2Fblockbase_presentation
        const qrCodeImage = await QRCode.toDataURL(url);
        res.setHeader("Content-Type", "image/png");
        res.send(Buffer.from(qrCodeImage.split(",")[1], "base64"));
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating QR Code");
    }
    return undefined;
});

// https://wallet.example.com?
// client_id=https%3A%2F%2Fclient.example.org%2Fcb
// &request_uri=https%3A%2F%2Fclient.example.org%2F567545564

app.get("/presentationRequest/:id", async (req, res) => {
    const presentationDefinition = createPresentationDefinition(req.params.id);
    res.status(200).json(presentationDefinition);
});

app.get("/presentationdefs", (req, res) => {
    const { ref } = req.query;
    const presentationDefinition = createPresentationDefinition(ref as string);
    res.status(200).json(presentationDefinition);
});

app.post("/present", async (req, res) => {
    const { presentation_submission, vp_token, state } = req.body;
    if (!vp_token) {
        return res.status(400).send("Missing vp_token");
    }
    // セッションに紐づいているか確認
    if (!getSession(state)) {
        return res.status(400).send("Missing state");
    }
    if (!presentation_submission) {
        return res.status(400).send("Missing presentation_submission");
    }

    const { scope } = getSession(state);
    if (scope === "id_token") {
        // SIOP verify https://openid.bitbucket.io/connect/openid-connect-self-issued-v2-1_0.html#section-11.1
        const { id_token } = req.body;
        const { payload } = await verifyToken(id_token);
        if (
            payload.iss !== payload.sub ||
            payload.aud === "https://self-issued.me/v2"
        ) {
            return res.status(400).send("Invalid id_token");
        }
    }

    presentation_submission.descriptor_map.map((descriptor: any) => {
        const { format } = descriptor;
        console.log(descriptor);

        // VP verify
        const vp = jsonpath.query(vp_token, descriptor.path)[0];
        console.log(vp);

        // VC verify
        const vc = jsonpath.query(vp_token, descriptor.path_nested.path)[0];
        console.log(vc);
    });
    return res.status(200).json({ vp_token, state });
});

const port = process.env.PORT || 8000; // 環境変数からポートを取得し、存在しない場合は8000をデフォルトとします。

app.listen(port, () => console.log(`Server is running on port ${port}`));
