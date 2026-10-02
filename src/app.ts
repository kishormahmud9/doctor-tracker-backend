import express, { Application } from "express";
import cors from "cors";
import { config } from "./config/env";
import apiRoutes from "./routes";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";

export const createApp = (): Application => {
    const app = express();

    // Basic security and parsing middleware
    app.use(
        cors({
            origin: config.clientUrl,
            credentials: true,
        })
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // API Routes
    app.use("/api", apiRoutes);

    // Fallback handlers
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

export const app = createApp();
export default app;
