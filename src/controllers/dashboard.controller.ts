import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";

export const getSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        const result = await dashboardService.getSummary({
            startDate: typeof startDate === "string" ? startDate : undefined,
            endDate: typeof endDate === "string" ? endDate : undefined,
        });

        res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const getPatientsPerDoctor = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctors = await dashboardService.getPatientsPerDoctor();

        res.status(200).json({
            status: "success",
            data: {
                doctors,
                totalDoctors: doctors.length,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getDateStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { startDate, endDate, groupBy, timezone } = req.query;

        const result = await dashboardService.getDateStatistics({
            startDate: typeof startDate === "string" ? startDate : undefined,
            endDate: typeof endDate === "string" ? endDate : undefined,
            groupBy: typeof groupBy === "string" && ["day", "month"].includes(groupBy.toLowerCase())
                ? (groupBy.toLowerCase() as "day" | "month")
                : undefined,
            timezone: typeof timezone === "string" ? timezone : undefined,
        });

        res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};
