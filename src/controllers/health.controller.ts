import { Request, Response } from "express";
import { config } from "../config/env";
import { getDatabaseStatus } from "../config/database";

export const getHealthCheck = (_req: Request, res: Response): void => {
    const dbStatus = getDatabaseStatus();

    res.status(200).json({
        status: "ok",
        service: "doctor-tracker-api",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: config.nodeEnv,
        database: {
            status: dbStatus,
            connected: dbStatus === "connected",
        },
    });
};
