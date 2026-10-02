import http from "http";
import app from "./app";
import { config } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { logger } from "./utils/logger";

const server = http.createServer(app);

const startServer = async (): Promise<void> => {
    // Start HTTP listener
    server.listen(config.port, () => {
        logger.info(
            `Doctor Tracker backend listening on port ${config.port} [${config.nodeEnv}]`
        );
        logger.info(`Health check available at http://localhost:${config.port}/api/health`);
    });

    // Attempt database connection in background without blocking server availability
    connectDatabase().catch((err) => {
        logger.warn(`Database connection error during startup: ${err.message}`);
    });
};

const handleGracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        await disconnectDatabase();
        logger.info("HTTP server and database connections closed.");
        process.exit(0);
    });
};

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

startServer().catch((err) => {
    logger.error(`Fatal error during server startup: ${err.message}`);
    process.exit(1);
});
