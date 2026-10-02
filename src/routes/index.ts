import { Router } from "express";
import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import doctorRoutes from "./doctor.routes";
import patientRoutes from "./patient.routes";
import dashboardRoutes from "./dashboard.routes";


const router = Router();

// Mount sub-routes
router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);
router.use("/dashboard", dashboardRoutes);


export default router;
