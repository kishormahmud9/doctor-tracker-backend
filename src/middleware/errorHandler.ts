import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error("[Error]", err.stack || err.message);

    res.status(500).json({
        status: "error",
        message: config.isProduction ? "Internal server error" : err.message,
        ...(config.isProduction ? {} : { stack: err.stack }),
    });
};
