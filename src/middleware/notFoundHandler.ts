import { Request, Response } from "express";

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        status: "fail",
        message: `Resource not found: ${req.method} ${req.originalUrl}`,
    });
};
