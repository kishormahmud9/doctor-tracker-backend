import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isTest = nodeEnv === "test";
const rawClientUrls = process.env.CLIENT_URL || "http://localhost:3000";
const clientUrls = rawClientUrls
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""));

const jwtSecret = process.env.JWT_SECRET || (isProduction ? "" : "default_jwt_secret_change_in_production");

if (isProduction) {
    if (
        !jwtSecret ||
        jwtSecret === "default_jwt_secret_change_in_production" ||
        jwtSecret === "your_jwt_secret_key_here" ||
        jwtSecret.length < 32
    ) {
        throw new Error(
            "Fatal configuration error: In production mode, JWT_SECRET must be set to a strong secret of at least 32 characters."
        );
    }
}

export const config = {
    port: parseInt(process.env.PORT || "5000", 10),
    mongoUri: isTest
        ? process.env.TEST_MONGODB_URI || "mongodb://localhost:27017/doctor-tracker-test"
        : process.env.MONGODB_URI || "mongodb://localhost:27017/doctorDB",
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
    clientUrls,
    rawClientUrls,
    nodeEnv,
    isProduction,
    isTest,
};
