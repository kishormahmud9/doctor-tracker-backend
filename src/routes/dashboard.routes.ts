import { Router } from "express";
import {
    getSummary,
    getPatientsPerDoctor,
    getDateStatistics,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateDashboardDateQuery } from "../validators/dashboard.validator";

const router = Router();

// Protect all dashboard endpoints with existing admin JWT authentication
router.use(authenticate);

// GET /api/dashboard/summary - Total doctors, total patients, average patients per doctor
router.get("/summary", validateDashboardDateQuery, getSummary);

// GET /api/dashboard/patients-per-doctor - Patients count per doctor (includes zero patients)
router.get("/patients-per-doctor", getPatientsPerDoctor);

// GET /api/dashboard/date-statistics - Time-series registration statistics for doctors and patients
router.get("/date-statistics", validateDashboardDateQuery, getDateStatistics);

export default router;
