import express, { Application } from "express";
import cors from "cors";
import { config } from "./config/env";
import apiRoutes from "./routes";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";
import { databaseMiddleware } from "./middleware/database.middleware";

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

    // Ensure database connection for all incoming requests (crucial for Serverless / Vercel)
    app.use(databaseMiddleware);

    // API Routes
    app.use("/api", apiRoutes);

    // Fallback handlers
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

export const app = createApp();
export default app;
