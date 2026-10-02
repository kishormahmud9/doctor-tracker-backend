import { Request, Response, NextFunction } from "express";
import {
    doctorService,
    DuplicateDoctorEmailError,
} from "../services/doctor.service";

export const createDoctor = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctor = await doctorService.createDoctor(req.body);

        res.status(201).json({
            status: "success",
            message: "Doctor created successfully",
            data: {
                doctor,
            },
        });
    } catch (err) {
        if (err instanceof DuplicateDoctorEmailError) {
            res.status(409).json({
                status: "fail",
                message: err.message,
            });
            return;
        }
        next(err);
    }
};

export const getDoctors = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { page, limit, search, specialization, hospital, startDate, endDate } =
            req.query;

        const result = await doctorService.getDoctors({
            page: page !== undefined ? Number(page) : undefined,
            limit: limit !== undefined ? Number(limit) : undefined,
            search: typeof search === "string" ? search : undefined,
            specialization: typeof specialization === "string" ? specialization : undefined,
            hospital: typeof hospital === "string" ? hospital : undefined,
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

export const getDoctorById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const doctor = await doctorService.getDoctorById(id);

        if (!doctor) {
            res.status(404).json({
                status: "fail",
                message: "Doctor not found",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            data: {
                doctor,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const updateDoctor = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const doctor = await doctorService.updateDoctor(id, req.body);

        if (!doctor) {
            res.status(404).json({
                status: "fail",
                message: "Doctor not found",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            message: "Doctor updated successfully",
            data: {
                doctor,
            },
        });
    } catch (err) {
        if (err instanceof DuplicateDoctorEmailError) {
            res.status(409).json({
                status: "fail",
                message: err.message,
            });
            return;
        }
        next(err);
    }
};

export const deleteDoctor = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const result = await doctorService.deleteDoctor(id);

        if (result.notFound) {
            res.status(404).json({
                status: "fail",
                message: "Doctor not found",
            });
            return;
        }

        if (!result.deleted) {
            res.status(400).json({
                status: "fail",
                message: result.reason || "Doctor cannot be deleted",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            message: "Doctor deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};
