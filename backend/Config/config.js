require("dotenv").config();
const crypto = require("crypto");


const emailSecretKey = Buffer.from(process.env.AES_EMAIL_SECRET_KEY, 'hex');
if (emailSecretKey.length !== 32) {
    throw new Error("AES_EMAIL_SECRET_KEY must be 32 bytes long.");
}

const config = {
    emailSecretKey,
    mongoURI: process.env.ATLAS_URI,
    jwtKey: process.env.JWT_SECRET_KEY,
    clientUrl: process.env.CLIENT_URL,
    port: process.env.PORT || 5000,
};

module.exports = config;
