import { Router } from "express";
import {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
} from "../controllers/patient.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
    validateCreatePatient,
    validateUpdatePatient,
    validatePatientId,
    validateGetPatientsQuery,
} from "../validators/patient.validator";

const router = Router();

// Protect all patient routes with admin JWT authentication
router.use(authenticate);

// POST /api/patients - Create a new patient
router.post("/", validateCreatePatient, createPatient);

// GET /api/patients - List patients with pagination, search, and filters
router.get("/", validateGetPatientsQuery, getPatients);

// GET /api/patients/:id - Get single patient by ID
router.get("/:id", validatePatientId, getPatientById);

// PATCH /api/patients/:id - Update an existing patient
router.patch("/:id", validatePatientId, validateUpdatePatient, updatePatient);

// DELETE /api/patients/:id - Delete a patient
router.delete("/:id", validatePatientId, deletePatient);

export default router;
