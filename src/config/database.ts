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

let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDatabase = async (): Promise<boolean> => {
    // 1. If already connected, reuse existing connection
    if (mongoose.connection.readyState === 1) {
        return true;
    }

    if (!config.mongoUri) {
        console.warn("[Database] No MONGODB_URI configured. Running without database connection.");
        return false;
    }

    // 2. If connection is already in progress, wait for it
    if (cachedPromise) {
        try {
            await cachedPromise;
            return true;
        } catch {
            cachedPromise = null;
        }
    }

    // 3. Initiate new connection with proper serverless timeout
    try {
        console.log("[Database] Attempting connection to MongoDB...");
        cachedPromise = mongoose.connect(config.mongoUri, {
            serverSelectionTimeoutMS: 5000,
            dbName: config.isTest ? undefined : "doctorDB",
        });
        await cachedPromise;
        console.log("[Database] Successfully connected to MongoDB.");
        return true;
    } catch (error) {
        cachedPromise = null;
        const message = error instanceof Error ? error.message : "Unknown error";
        console.warn(`[Database] Initial MongoDB connection failed (${message}). Server remains operational.`);
        return false;
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        cachedPromise = null;
        console.log("[Database] Disconnected from MongoDB.");
    }
};
