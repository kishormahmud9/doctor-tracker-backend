import mongoose from "mongoose";
import { config } from "./env";

export type DatabaseStatus = "connected" | "connecting" | "disconnecting" | "disconnected";

export const getDatabaseStatus = (): DatabaseStatus => {
    switch (mongoose.connection.readyState) {
        case 1:
            return "connected";
        case 2:
            return "connecting";
        case 3:
            return "disconnecting";
        default:
            return "disconnected";
    }
};

export const connectDatabase = async (): Promise<boolean> => {
    if (!config.mongoUri) {
        console.warn("[Database] No MONGODB_URI configured. Running without database connection.");
        return false;
    }

    try {
        console.log("[Database] Attempting connection to MongoDB...");
        await mongoose.connect(config.mongoUri, {
            serverSelectionTimeoutMS: 5000,
            dbName: config.isTest ? undefined : "doctorDB",
        });
        console.log("[Database] Successfully connected to MongoDB.");
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.warn(`[Database] Initial MongoDB connection failed (${message}). Server remains operational.`);
        return false;
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("[Database] Disconnected from MongoDB.");
    }
};
