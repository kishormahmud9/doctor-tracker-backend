import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                status: "fail",
                message: "Authentication required. Bearer token missing.",
            });
            return;
        }

        const token = authHeader.split(" ")[1]?.trim();

        if (!token) {
            res.status(401).json({
                status: "fail",
                message: "Authentication required. Bearer token missing.",
            });
            return;
        }

        let decodedPayload;
        try {
            decodedPayload = authService.verifyToken(token);
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                res.status(401).json({
                    status: "fail",
                    message: "Token expired. Please log in again.",
                });
                return;
            }
            res.status(401).json({
                status: "fail",
                message: "Invalid authentication token.",
            });
            return;
        }

        if (!decodedPayload || !decodedPayload.adminId) {
            res.status(401).json({
                status: "fail",
                message: "Invalid authentication token.",
            });
            return;
        }

        const admin = await authService.getAdminById(decodedPayload.adminId);
        if (!admin) {
            res.status(401).json({
                status: "fail",
                message: "Authenticated admin no longer exists.",
            });
            return;
        }

        req.admin = admin;
        next();
    } catch (err) {
        next(err);
    }
};
