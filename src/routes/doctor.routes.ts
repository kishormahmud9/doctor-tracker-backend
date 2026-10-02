import { Router } from "express";
import {
    createDoctor,
    getDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
} from "../controllers/doctor.controller";
import {
    getDoctorPatients,
    createDoctorPatient,
    deleteDoctorPatient,
} from "../controllers/patient.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
    validateCreateDoctor,
    validateUpdateDoctor,
    validateDoctorId,
    validateGetDoctorsQuery,
} from "../validators/doctor.validator";
import {
    validateCreatePatient,
    validateDoctorPatientParams,
    validateGetPatientsQuery as validateGetDoctorPatientsQuery,
} from "../validators/patient.validator";

const router = Router();

// Protect all doctor routes with admin JWT authentication
router.use(authenticate);

// POST /api/doctors - Create a new doctor
router.post("/", validateCreateDoctor, createDoctor);

// GET /api/doctors - List doctors with pagination, search, and filters
router.get("/", validateGetDoctorsQuery, getDoctors);

// GET /api/doctors/:id - Get single doctor by ID
router.get("/:id", validateDoctorId, getDoctorById);

// PATCH /api/doctors/:id - Update an existing doctor
router.patch("/:id", validateDoctorId, validateUpdateDoctor, updateDoctor);

// DELETE /api/doctors/:id - Delete a doctor
router.delete("/:id", validateDoctorId, deleteDoctor);

// ----------------------------------------------------
// Doctor-to-Patient Scoped Endpoints
// ----------------------------------------------------

// GET /api/doctors/:id/patients - Return patients associated with specific doctor
router.get("/:id/patients", validateDoctorId, validateGetDoctorPatientsQuery, getDoctorPatients);

// POST /api/doctors/:id/patients - Create a patient associated with specific doctor
router.post(
    "/:id/patients",
    validateDoctorId,
    (req, _res, next) => {
        // Override doctorId from route parameter to prevent body tampering
        req.body = req.body || {};
        req.body.doctorId = req.params.id;
        next();
    },
    validateCreatePatient,
    createDoctorPatient
);

// DELETE /api/doctors/:doctorId/patients/:patientId - Delete patient under specific doctor
router.delete(
    "/:doctorId/patients/:patientId",
    validateDoctorPatientParams,
    deleteDoctorPatient
);

export default router;
