import { Router } from "express";
import { getHealthCheck } from "../controllers/health.controller";

const router = Router();

router.get("/health", getHealthCheck);

export default router;
