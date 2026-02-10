import crypto from "crypto";
import Mailer from "~~/server/services/mailer.service";

const service = {
    createLoginToken,
    sendLoginToken,
    getUserByLoginToken,
    getUserByLoginHash,
};

export default service;

async function createLoginToken(email) {
    // const token = crypto.randomBytes(2).toString("hex").toUpperCase();
    const token = generateRandomLetters(4).toUpperCase();
    const hash = crypto.randomBytes(48).toString("hex").toLowerCase();
    await LoginTokenModel.create({ email, token, hash });
    return { token, hash };
}

function generateRandomLetters(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function getUserByLoginToken(email, token, hash = true) {
    if (await LoginTokenModel.verify(email, token, hash))
        return await UserModel.findOne({ email }) || await UserModel.create({ email });
}

async function getUserByLoginHash(hash) {
    hash = crypto.createHash("sha256").update(hash).digest("hex");
    const loginToken = await LoginTokenModel.findOne({ hash });
    if (!loginToken) return;
    const { email, token } = loginToken;
    return await getUserByLoginToken(email, token, false);
}

function sendLoginToken(email, credentials) {
    // TODO localize message
    const message = `
<p>Your login token: <strong>${credentials.token}</strong></p>
`;
    // <p>You can also use this link to login: ${global.config.BASE_URL}/auth/login/${credentials.hash}</p>
    Mailer.send("Login Token", message, email);
}