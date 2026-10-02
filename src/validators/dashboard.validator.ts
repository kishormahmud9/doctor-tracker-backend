import { Request, Response, NextFunction } from "express";

export interface ValidationErrorItem {
    field: string;
    message: string;
}

export const validateDashboardDateQuery = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: ValidationErrorItem[] = [];
    const { startDate, endDate, groupBy } = req.query;

    let parsedStart: Date | undefined;
    let parsedEnd: Date | undefined;

    if (startDate !== undefined) {
        if (typeof startDate !== "string" || isNaN(Date.parse(startDate))) {
            errors.push({
                field: "startDate",
                message: "startDate must be a valid ISO or YYYY-MM-DD date string",
            });
        } else {
            parsedStart = new Date(startDate);
        }
    }

    if (endDate !== undefined) {
        if (typeof endDate !== "string" || isNaN(Date.parse(endDate))) {
            errors.push({
                field: "endDate",
                message: "endDate must be a valid ISO or YYYY-MM-DD date string",
            });
        } else {
            parsedEnd = new Date(endDate);
        }
    }

    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
        errors.push({
            field: "startDate",
            message: "startDate cannot be after endDate",
        });
    }

    if (groupBy !== undefined) {
        if (typeof groupBy !== "string" || !["day", "month"].includes(groupBy.toLowerCase())) {
            errors.push({
                field: "groupBy",
                message: "groupBy must be either 'day' or 'month'",
            });
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
