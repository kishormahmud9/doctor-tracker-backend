import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export interface ValidationErrorItem {
    field: string;
    message: string;
}

const EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const validateCreateDoctor = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationErrorItem[] = [];
    const { name, specialization, hospital, phone, email } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
        errors.push({ field: "name", message: "Doctor name is required" });
    } else if (name.trim().length < 2 || name.trim().length > 120) {
        errors.push({
            field: "name",
            message: "Doctor name must be between 2 and 120 characters",
        });
    }

    if (!specialization || typeof specialization !== "string" || !specialization.trim()) {
        errors.push({ field: "specialization", message: "Specialization is required" });
    } else if (specialization.trim().length < 2 || specialization.trim().length > 100) {
        errors.push({
            field: "specialization",
            message: "Specialization must be between 2 and 100 characters",
        });
    }

    if (!hospital || typeof hospital !== "string" || !hospital.trim()) {
        errors.push({ field: "hospital", message: "Hospital name is required" });
    } else if (hospital.trim().length < 2 || hospital.trim().length > 150) {
        errors.push({
            field: "hospital",
            message: "Hospital name must be between 2 and 150 characters",
        });
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
        errors.push({ field: "phone", message: "Phone number is required" });
    } else if (phone.trim().length < 7 || phone.trim().length > 25) {
        errors.push({
            field: "phone",
            message: "Phone number must be between 7 and 25 characters",
        });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
        errors.push({ field: "email", message: "Doctor email is required" });
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.push({ field: "email", message: "Please provide a valid email address" });
    }

    if (errors.length > 0) {
        res.status(400).json({
            status: "fail",
            message: "Validation failed",
            errors,
        });
        return;
    }

    // Normalize inputs
    req.body.name = name.trim();
    req.body.specialization = specialization.trim();
    req.body.hospital = hospital.trim();
    req.body.phone = phone.trim();
    req.body.email = email.trim().toLowerCase();

    next();
};

export const validateUpdateDoctor = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationErrorItem[] = [];
    const { name, specialization, hospital, phone, email } = req.body || {};

    const allowedFields = ["name", "specialization", "hospital", "phone", "email"];
    const providedKeys = Object.keys(req.body || {}).filter((k) =>
        allowedFields.includes(k)
    );

    if (providedKeys.length === 0) {
        res.status(400).json({
            status: "fail",
            message: "At least one valid field must be provided for update",
        });
        return;
    }

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            errors.push({ field: "name", message: "Doctor name cannot be empty" });
        } else if (name.trim().length < 2 || name.trim().length > 120) {
            errors.push({
                field: "name",
                message: "Doctor name must be between 2 and 120 characters",
            });
        } else {
            req.body.name = name.trim();
        }
    }

    if (specialization !== undefined) {
        if (typeof specialization !== "string" || !specialization.trim()) {
            errors.push({ field: "specialization", message: "Specialization cannot be empty" });
        } else if (specialization.trim().length < 2 || specialization.trim().length > 100) {
            errors.push({
                field: "specialization",
                message: "Specialization must be between 2 and 100 characters",
            });
        } else {
            req.body.specialization = specialization.trim();
        }
    }

    if (hospital !== undefined) {
        if (typeof hospital !== "string" || !hospital.trim()) {
            errors.push({ field: "hospital", message: "Hospital cannot be empty" });
        } else if (hospital.trim().length < 2 || hospital.trim().length > 150) {
            errors.push({
                field: "hospital",
                message: "Hospital must be between 2 and 150 characters",
            });
        } else {
            req.body.hospital = hospital.trim();
        }
    }

    if (phone !== undefined) {
        if (typeof phone !== "string" || !phone.trim()) {
            errors.push({ field: "phone", message: "Phone number cannot be empty" });
        } else if (phone.trim().length < 7 || phone.trim().length > 25) {
            errors.push({
                field: "phone",
                message: "Phone number must be between 7 and 25 characters",
            });
        } else {
            req.body.phone = phone.trim();
        }
    }

    if (email !== undefined) {
        if (typeof email !== "string" || !email.trim()) {
            errors.push({ field: "email", message: "Email cannot be empty" });
        } else if (!EMAIL_REGEX.test(email.trim())) {
            errors.push({ field: "email", message: "Please provide a valid email address" });
        } else {
            req.body.email = email.trim().toLowerCase();
        }
    }

    if (errors.length > 0) {
        res.status(400).json({
            status: "fail",
            message: "Validation failed",
            errors,
        });
        return;
    }

    next();
};

export const validateDoctorId = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { id } = req.params;

    if (!id || !mongoose.isValidObjectId(id)) {
        res.status(400).json({
            status: "fail",
            message: "Invalid doctor ID format",
        });
        return;
    }

    next();
};

export const validateGetDoctorsQuery = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationErrorItem[] = [];
    const { page, limit, startDate, endDate } = req.query;

    if (page !== undefined) {
        const pageNum = Number(page);
        if (!Number.isInteger(pageNum) || pageNum < 1) {
            errors.push({
                field: "page",
                message: "Page must be a positive integer greater than or equal to 1",
            });
        }
    }

    if (limit !== undefined) {
        const limitNum = Number(limit);
        if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
            errors.push({
                field: "limit",
                message: "Limit must be an integer between 1 and 100",
            });
        }
    }

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate !== undefined) {
        if (typeof startDate !== "string" || isNaN(Date.parse(startDate))) {
            errors.push({
                field: "startDate",
                message: "startDate must be a valid ISO date string",
            });
        } else {
            parsedStartDate = new Date(startDate);
        }
    }

    if (endDate !== undefined) {
        if (typeof endDate !== "string" || isNaN(Date.parse(endDate))) {
            errors.push({
                field: "endDate",
                message: "endDate must be a valid ISO date string",
            });
        } else {
            parsedEndDate = new Date(endDate);
        }
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
        errors.push({
            field: "startDate",
            message: "startDate cannot be after endDate",
        });
    }

    if (errors.length > 0) {
        res.status(400).json({
            status: "fail",
            message: "Validation failed",
            errors,
        });
        return;
    }

    next();
};
