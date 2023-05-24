import BlockBasePD from "./presentation_definition/BlockBaseVC.json";

const presentaiotinDefinition: any = {
    blockbase_presentation: BlockBasePD,
};

export const createPresentationDefinition = (id: string) => {
    // セッションに紐付いて作成する
    const nonce = "n-0S6_WzA2Mj";
    const state = "eyJhb...6-sVA";

    const presentationDefinition = {
        client_id: process.env.VERIFIER_DOMAIN + "/present",
        client_id_scheme: "redirect_uri",
        response_uri: process.env.VERIFIER_DOMAIN + "/present",
        response_type: "vp_token id_token",
        response_mode: "direct_post",
        // SIOP v2
        id_token_type: "subject_signed",
        presentation_definition: presentaiotinDefinition[id as string],
        nonce,
        state,
    };

    return presentationDefinition;
};
