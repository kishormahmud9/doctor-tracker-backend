import express, { Application } from "express";
import cors from "cors";
import { config } from "./config/env";
import apiRoutes from "./routes";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";
import { databaseMiddleware } from "./middleware/database.middleware";

export const createApp = (): Application => {
    const app = express();

    const allowedOrigins: (string | RegExp)[] = [
        ...config.clientUrls,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://doctor-tracker-frontend-tan.vercel.app",
        /\.vercel\.app$/,
    ];

    // Basic security and parsing middleware
    app.use(
        cors({
            origin: (origin, callback) => {

                if (!origin) return callback(null, true);
                const isAllowed = allowedOrigins.some((allowed) => {
                    if (allowed instanceof RegExp) {
                        return allowed.test(origin);
                    }
                    return allowed === origin;
                });
                if (isAllowed) {
                    callback(null, true);
                } else {
                    console.warn(`[CORS] Blocked request from origin: ${origin}`);
                    callback(new Error(`CORS blocked for origin: ${origin}`));
                }
            },
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
            optionsSuccessStatus: 200,
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
