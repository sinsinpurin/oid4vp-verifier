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

dotenv.config();

const app = express();

app.use(express.json());

const presentaiotinDefinition: any = {
    blockbase_presentation: BlockBasePD,
};

app.get("/", (_, res) => {
    res.send("Hello world");
});

/**
 * This endpoint shows QR code
 */
app.get("/qr", async (_, res) => {
    try {
        const url = "openid-credential-offer://?credential_offer=";
        const offerRequest = {
            credential_issuer: process.env.ISSUER_ENDPOINT as string,
            credentials: ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
        };
        if (!url) {
            return res.status(400).send("URL query parameter is required");
        }
        const qrCodeImage = await QRCode.toDataURL(
            url + encodeURI(JSON.stringify(offerRequest)),
        );
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
    res.status(200).json(presentaiotinDefinition[ref as string]);
});

app.post("/present", async (req, res) => {
    const { presentation_submission, vp_token, state } = req.body;
    // if (!vp_token) {
    //     return res.status(400).send("Missing vp_token");
    // }
    // // セッションに紐づいているか確認
    // if (!getSession(state)) {
    //     return res.status(400).send("Missing state");
    // }
    // if (!presentation_submission) {
    //     return res.status(400).send("Missing presentation_submission");
    // }

    // const { scope } = getSession(state);
    // if (scope === "vp_token id_token") {
    //     // SIOP verify
    //     const { id_token } = req.body;
    //     const { payload } = await verifyToken(id_token);
    //     if (
    //         payload.iss !== payload.sub ||
    //         payload.aud === "https://self-issued.me/v2"
    //     ) {
    //         return res.status(400).send("Invalid id_token");
    //     }
    // }

    presentaiotinDefinition.descriptor_map.map((descriptor: any) => {
        const { format } = descriptor;
        const vp = jsonpath.query(vp_token, descriptor.path);
        // VP verify

        const vc = jsonpath.query(vp_token, descriptor.path_nested);
        // VC verify
        if (format === "jwt_vp") {
            const { path } = descriptor;
            const vp = presentation_submission.verifiable_presentations[0];
            const vc = vp[path];
            const { payload } = verifyToken(vc);
            const did = getDid(vc);
            // didの検証
            if (did !== payload.iss) {
                return res.status(400).send("Invalid did");
            }
        }
    });
    return res.status(200).json({ vp_token, state });
});

const port = process.env.PORT || 8000; // 環境変数からポートを取得し、存在しない場合は8000をデフォルトとします。

app.listen(port, () => console.log(`Server is running on port ${port}`));
