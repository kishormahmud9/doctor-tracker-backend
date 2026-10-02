import { Request, Response, NextFunction } from "express";

export interface ValidationErrorItem {
    field: string;
    message: string;
}

export const validateLogin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationErrorItem[] = [];
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
        errors.push({ field: "email", message: "Email is required" });
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errors.push({ field: "email", message: "Please provide a valid email address" });
        }
    }

    if (!password || typeof password !== "string" || !password.trim()) {
        errors.push({ field: "password", message: "Password is required" });
    }

    if (errors.length > 0) {
        res.status(400).json({
            status: "fail",
            message: "Validation failed",
            errors,
        });
        return;
    }

    // Normalize email on request body
    req.body.email = email.trim().toLowerCase();
    next();
};
