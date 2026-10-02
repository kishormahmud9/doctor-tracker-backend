import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export interface ValidationErrorItem {
    field: string;
    message: string;
}

const EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const VALID_GENDERS = ["male", "female", "other"];

export const validateCreatePatient = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationErrorItem[] = [];
    const { name, age, gender, phone, condition, doctorId, email } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
        errors.push({ field: "name", message: "Patient name is required" });
    } else if (name.trim().length < 2 || name.trim().length > 120) {
        errors.push({
            field: "name",
            message: "Patient name must be between 2 and 120 characters",
        });
    }

    if (age === undefined || age === null || age === "") {
        errors.push({ field: "age", message: "Patient age is required" });
    } else {
        const ageNum = Number(age);
        if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
            errors.push({
                field: "age",
                message: "Age must be an integer between 0 and 130",
            });
        }
    }

    if (!gender || typeof gender !== "string" || !gender.trim()) {
        errors.push({ field: "gender", message: "Patient gender is required" });
    } else {
        const normalizedGender = gender.trim().toLowerCase();
        if (!VALID_GENDERS.includes(normalizedGender)) {
            errors.push({
                field: "gender",
                message: "Gender must be 'male', 'female', or 'other'",
            });
        }
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
        errors.push({ field: "phone", message: "Phone number is required" });
    } else if (phone.trim().length < 7 || phone.trim().length > 25) {
        errors.push({
            field: "phone",
            message: "Phone number must be between 7 and 25 characters",
        });
    }

    if (!condition || typeof condition !== "string" || !condition.trim()) {
        errors.push({ field: "condition", message: "Medical condition is required" });
    } else if (condition.trim().length < 2 || condition.trim().length > 100) {
        errors.push({
            field: "condition",
            message: "Medical condition must be between 2 and 100 characters",
        });
    }

    if (!doctorId || typeof doctorId !== "string" || !doctorId.trim()) {
        errors.push({ field: "doctorId", message: "Doctor ID is required" });
    } else if (!mongoose.isValidObjectId(doctorId.trim())) {
        errors.push({ field: "doctorId", message: "Invalid doctor ID format" });
    }

    if (email !== undefined && email !== null && typeof email === "string" && email.trim()) {
        if (!EMAIL_REGEX.test(email.trim())) {
            errors.push({ field: "email", message: "Please provide a valid email address" });
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

    // Normalize request body
    req.body.name = name.trim();
    req.body.age = Number(age);
    req.body.gender = gender.trim().toLowerCase();
    req.body.phone = phone.trim();
    req.body.condition = condition.trim();
    req.body.doctorId = doctorId.trim();
    if (email && typeof email === "string" && email.trim()) {
        req.body.email = email.trim().toLowerCase();
    } else {
        delete req.body.email;
    }

    next();
};

export const validateUpdatePatient = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationErrorItem[] = [];
    const { name, age, gender, phone, condition, doctorId, email } = req.body || {};

    // Disallow modifying internal MongoDB fields
    delete req.body._id;
    delete req.body.__v;
    delete req.body.createdAt;
    delete req.body.updatedAt;

    const allowedFields = ["name", "age", "gender", "phone", "condition", "doctorId", "email"];
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
            errors.push({ field: "name", message: "Patient name cannot be empty" });
        } else if (name.trim().length < 2 || name.trim().length > 120) {
            errors.push({
                field: "name",
                message: "Patient name must be between 2 and 120 characters",
            });
        } else {
            req.body.name = name.trim();
        }
    }

    if (age !== undefined) {
        const ageNum = Number(age);
        if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
            errors.push({
                field: "age",
                message: "Age must be an integer between 0 and 130",
            });
        } else {
            req.body.age = ageNum;
        }
    }

    if (gender !== undefined) {
        if (typeof gender !== "string" || !gender.trim()) {
            errors.push({ field: "gender", message: "Gender cannot be empty" });
        } else {
            const normalizedGender = gender.trim().toLowerCase();
            if (!VALID_GENDERS.includes(normalizedGender)) {
                errors.push({
                    field: "gender",
                    message: "Gender must be 'male', 'female', or 'other'",
                });
            } else {
                req.body.gender = normalizedGender;
            }
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

    if (condition !== undefined) {
        if (typeof condition !== "string" || !condition.trim()) {
            errors.push({ field: "condition", message: "Medical condition cannot be empty" });
        } else if (condition.trim().length < 2 || condition.trim().length > 100) {
            errors.push({
                field: "condition",
                message: "Medical condition must be between 2 and 100 characters",
            });
        } else {
            req.body.condition = condition.trim();
        }
    }

    if (doctorId !== undefined) {
        if (typeof doctorId !== "string" || !doctorId.trim()) {
            errors.push({ field: "doctorId", message: "Doctor ID cannot be empty" });
        } else if (!mongoose.isValidObjectId(doctorId.trim())) {
            errors.push({ field: "doctorId", message: "Invalid doctor ID format" });
        } else {
            req.body.doctorId = doctorId.trim();
        }
    }

    if (email !== undefined) {
        if (email === null || email === "") {
            req.body.email = undefined;
        } else if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
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

export const validatePatientId = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const id = req.params.id as string | undefined;

    if (!id || typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        res.status(400).json({
            status: "fail",
            message: "Invalid patient ID format",
        });
        return;
    }

    next();
};

export const validateDoctorPatientParams = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const doctorId = (req.params.doctorId || req.params.id) as string | undefined;
    const patientId = req.params.patientId as string | undefined;

    if (!doctorId || typeof doctorId !== "string" || !mongoose.isValidObjectId(doctorId)) {
        res.status(400).json({
            status: "fail",
            message: "Invalid doctor ID format",
        });
        return;
    }

    if (patientId !== undefined) {
        if (typeof patientId !== "string" || !mongoose.isValidObjectId(patientId)) {
            res.status(400).json({
                status: "fail",
                message: "Invalid patient ID format",
            });
            return;
        }
    }

    next();
};

export const validateGetPatientsQuery = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationErrorItem[] = [];
    const { page, limit, doctorId, startDate, endDate } = req.query;

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

    if (doctorId !== undefined) {
        if (typeof doctorId !== "string" || !mongoose.isValidObjectId(doctorId.trim())) {
            errors.push({
                field: "doctorId",
                message: "Invalid doctor ID format",
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
