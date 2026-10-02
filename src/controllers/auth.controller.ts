import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        if (!result) {
            res.status(401).json({
                status: "fail",
                message: "Invalid email or password",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                token: result.token,
                admin: result.admin,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.admin) {
            res.status(401).json({
                status: "fail",
                message: "Authentication required",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            data: {
                admin: req.admin,
            },
        });
    } catch (err) {
        next(err);
    }
};
