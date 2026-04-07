// Edited By Wen Han Tang A0340008W, Adding debug functions
import mongoose from "mongoose";
import colors from "colors";

const getEnvValue = (key) => {
    if (process.env[key]) {
        return process.env[key];
    }

    const matchedKey = Object.keys(process.env).find((envKey) => envKey.trim() === key);
    return matchedKey ? process.env[matchedKey] : undefined;
};

const connectDB = async () => {
    try {
        const mongoUrl = getEnvValue("MONGO_URL")?.trim();
        if (!mongoUrl) {
            throw new Error("Missing MONGO_URL in environment variables");
        }

        const conn = await mongoose.connect(mongoUrl);
        console.log(`Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white);
    } catch (error) {
        console.log(`Error in Mongodb ${error}`.bgRed.white);
        process.exit(1);
    }
};

export default connectDB;