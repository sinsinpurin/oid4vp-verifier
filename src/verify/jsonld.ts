const jsigs = require("jsonld-signatures");
const {
    suites: { Ed25519Signature2018 },
} = require("jsonld-signatures");
const vc = require("vc-js");
const jsonld = require("jsonld");
import fetch from "node-fetch";

export async function verifyVC(document: any) {
    const did = document.proof.verificationMethod;

    const resp = await fetch(
        "https://dev.uniresolver.io/1.0/identifiers/" + did.split("#")[0],
        {
            method: "GET",
        },
    );
    const publicKey = (await resp.json()).didDocument
        .verificationMethod[0] as any;
    console.log(publicKey);

    const keyPair = await Ed25519VerificationKey2020.generate();
    // 公開キーを使用して署名スイートを設定します
    const suite = new Ed25519Signature2018({
        key: keyPair,
    });

    // 公開キーを使用して署名スイートを設定します
    const suite = new Ed25519Signature2018({
        verificationMethod: publicKey.id,
        key: publicKey,
    });

    const purpose = new jsigs.purposes.AssertionProofPurpose();

    // 検証オプションを設定します
    const options = {
        documentLoader: jsonld.documentLoader(),
        suite: suite,
        purpose: purpose,
    };

    // VCを検証します
    const { verified } = await vc.verify({
        credential: document,
        suite,
        documentLoader: jsonld.documentLoader(),
    });

    return verified;
}

// テストデータとしてのVCと公開キー
export const exampleVC = {
    "@context": [
        "https: //www.w3.org/2018/credentials/v1",
        "https: //mattr.global/contexts/vc-extensions/v2",
    ],
    type: ["VerifiableCredential", "BlockBaseVC"],
    issuer: {
        id: "did:key:z6Mksm3hensaRNjXMyRWo95UPoDB7DDyZvvXUe6VKszaCJBv",
        name: "BlockBase",
        logoUrl: "https: //www.block-base.co/favicon.7bd2b609.ico",
    },
    name: "BlockBase VC",
    description: "This credential shows that the person has attended a course.",
    credentialBranding: {
        backgroundColor: "#B00AA0",
        watermarkImageUrl: "https: //example.edu/img/watermark.png",
    },
    issuanceDate: "2023-05-17T08: 19: 58.751Z",
    credentialSubject: {
        given_name: "",
        id: "did:key:z6Mktc5NPGtv2ojPZV8YXPP64P1TjLM8AB59BuhbGjp2BSjt",
        name: "test",
    },
    proof: {
        type: "Ed25519Signature2018",
        created: "2023-05-17T08: 19: 58Z",
        jws: "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..CbTIiT8Ws90M1qnLC5Wvpnv3B9fliPW5a5L4pMyD21ndXSTvWXSQlvQ2zmaYSBKtXQDmXJtxAPTR4BFjBmTmAQ",
        proofPurpose: "assertionMethod",
        verificationMethod:
            "did:key:z6Mksm3hensaRNjXMyRWo95UPoDB7DDyZvvXUe6VKszaCJBv#z6Mksm3hensaRNjXMyRWo95UPoDB7DDyZvvXUe6VKszaCJBv",
    },
};
const examplePublicKey = {
    /* Your Public Key here */
};

verifyVC(exampleVC)
    .then((verified) => {
        console.log("Verified:", verified);
    })
    .catch((error) => {
        console.error("Error verifying VC:", error);
    });
