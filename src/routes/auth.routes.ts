import { Router } from "express";
import { login, getMe } from "../controllers/auth.controller";
import { validateLogin } from "../validators/auth.validator";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// POST /api/auth/login
router.post("/login", validateLogin, login);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

export default router;
