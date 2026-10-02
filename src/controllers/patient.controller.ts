import { Request, Response, NextFunction } from "express";
import {
    patientService,
    ReferencedDoctorNotFoundError,
} from "../services/patient.service";
import { Doctor } from "../models/doctor.model";

export const createPatient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const patient = await patientService.createPatient(req.body);

        res.status(201).json({
            status: "success",
            message: "Patient created successfully",
            data: {
                patient,
            },
        });
    } catch (err) {
        if (err instanceof ReferencedDoctorNotFoundError) {
            res.status(404).json({
                status: "fail",
                message: err.message,
            });
            return;
        }
        next(err);
    }
};

export const getPatients = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { page, limit, search, doctorId, condition, startDate, endDate } =
            req.query;

        const result = await patientService.getPatients({
            page: page !== undefined ? Number(page) : undefined,
            limit: limit !== undefined ? Number(limit) : undefined,
            search: typeof search === "string" ? search : undefined,
            doctorId: typeof doctorId === "string" ? doctorId : undefined,
            condition: typeof condition === "string" ? condition : undefined,
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

export const getPatientById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const patient = await patientService.getPatientById(id);

        if (!patient) {
            res.status(404).json({
                status: "fail",
                message: "Patient not found",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            data: {
                patient,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const updatePatient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const patient = await patientService.updatePatient(id, req.body);

        if (!patient) {
            res.status(404).json({
                status: "fail",
                message: "Patient not found",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            message: "Patient updated successfully",
            data: {
                patient,
            },
        });
    } catch (err) {
        if (err instanceof ReferencedDoctorNotFoundError) {
            res.status(404).json({
                status: "fail",
                message: err.message,
            });
            return;
        }
        next(err);
    }
};

export const deletePatient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const deleted = await patientService.deletePatient(id);

        if (!deleted) {
            res.status(404).json({
                status: "fail",
                message: "Patient not found",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            message: "Patient deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};

// ----------------------------------------------------
// Doctor-to-Patient Scoped Endpoints
// ----------------------------------------------------

export const getDoctorPatients = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctorId = req.params.id as string;
        const doctorExists = await Doctor.exists({ _id: doctorId });

        if (!doctorExists) {
            res.status(404).json({
                status: "fail",
                message: "Doctor not found",
            });
            return;
        }

        const { page, limit, search, condition, startDate, endDate } = req.query;

        const result = await patientService.getPatients({
            doctorId,
            page: page !== undefined ? Number(page) : undefined,
            limit: limit !== undefined ? Number(limit) : undefined,
            search: typeof search === "string" ? search : undefined,
            condition: typeof condition === "string" ? condition : undefined,
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

export const createDoctorPatient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctorId = req.params.id as string;
        const doctorExists = await Doctor.exists({ _id: doctorId });

        if (!doctorExists) {
            res.status(404).json({
                status: "fail",
                message: "Doctor not found",
            });
            return;
        }

        // Enforce doctorId from route parameter to prevent parameter tampering
        req.body.doctorId = doctorId;

        const patient = await patientService.createPatient(req.body);

        res.status(201).json({
            status: "success",
            message: "Patient created successfully",
            data: {
                patient,
            },
        });
    } catch (err) {
        if (err instanceof ReferencedDoctorNotFoundError) {
            res.status(404).json({
                status: "fail",
                message: err.message,
            });
            return;
        }
        next(err);
    }
};

export const deleteDoctorPatient = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctorId = req.params.doctorId as string;
        const patientId = req.params.patientId as string;

        const result = await patientService.deleteDoctorPatient(doctorId, patientId);

        if (!result.success) {
            if (result.errorType === "DOCTOR_NOT_FOUND" || result.errorType === "PATIENT_NOT_FOUND") {
                res.status(404).json({
                    status: "fail",
                    message: result.message,
                });
                return;
            }
            res.status(400).json({
                status: "fail",
                message: result.message || "Failed to delete patient",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            message: "Patient deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};
