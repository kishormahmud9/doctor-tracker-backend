import { Request, Response, NextFunction } from "express";
import { connectDatabase } from "../config/database";

/**
 * Middleware that ensures database connection before handling any incoming request.
 * Crucial for serverless environments (e.g. Vercel) where cold starts and frozen containers occur.
 */
export const databaseMiddleware = async (
    _req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await connectDatabase();
    } catch (error) {
        console.error("[Database Middleware] Connection error:", error);
    }
    next();
};
