const session: any = {
    "eyJhb...6-sVA": {
        scope: "vp_token id_token",
        nonce: "n-0S6_WzA2Mj",
    },
};

export const createSession = (sessionID: string, param: any) => {
    session[sessionID] = param;
};

export const getSession = (state: string) => {
    return session[state];
};
