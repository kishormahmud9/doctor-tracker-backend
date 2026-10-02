import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Admin } from "../models/admin.model";
import { authService } from "../services/auth.service";
import { logger } from "../utils/logger";

interface SeedArgs {
    name?: string;
    email?: string;
    password?: string;
}

const parseCliArgs = (): SeedArgs => {
    const args = process.argv.slice(2);
    const result: SeedArgs = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if ((arg === "--name" || arg === "-n") && i + 1 < args.length) {
            result.name = args[++i];
        } else if (arg.startsWith("--name=")) {
            result.name = arg.slice("--name=".length);
        } else if ((arg === "--email" || arg === "-e") && i + 1 < args.length) {
            result.email = args[++i];
        } else if (arg.startsWith("--email=")) {
            result.email = arg.slice("--email=".length);
        } else if ((arg === "--password" || arg === "-p") && i + 1 < args.length) {
            result.password = args[++i];
        } else if (arg.startsWith("--password=")) {
            result.password = arg.slice("--password=".length);
        }
    }

    // Robust fallback: if flags were stripped by shell/npm runner, detect positional arguments
    if (!result.email || !result.password || !result.name) {
        const nonFlagArgs = args.filter((a) => !a.startsWith("-"));
        const emailIdx = nonFlagArgs.findIndex((a) => a.includes("@"));
        if (emailIdx !== -1 && nonFlagArgs.length >= 2) {
            result.email = result.email || nonFlagArgs[emailIdx];
            const others = nonFlagArgs.filter((_, idx) => idx !== emailIdx);
            if (others.length >= 2) {
                result.name = result.name || others[0];
                result.password = result.password || others[others.length - 1];
            }
        }
    }

    return result;
};

const promptInteractive = async (missing: string[]): Promise<SeedArgs> => {
    const rl = readline.createInterface({ input, output });
    const result: SeedArgs = {};

    try {
        if (missing.includes("name")) {
            result.name = (await rl.question("Enter Admin Name: ")).trim();
        }
        if (missing.includes("email")) {
            result.email = (await rl.question("Enter Admin Email: ")).trim();
        }
        if (missing.includes("password")) {
            result.password = await rl.question("Enter Admin Password: ");
        }
    } finally {
        rl.close();
    }

    return result;
};

export const runSeed = async (): Promise<void> => {
    const cliArgs = parseCliArgs();

    let name = cliArgs.name || process.env.ADMIN_NAME;
    let email = cliArgs.email || process.env.ADMIN_EMAIL;
    let password = cliArgs.password || process.env.ADMIN_PASSWORD;

    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!password) missing.push("password");

    if (missing.length > 0) {
        if (process.stdin.isTTY) {
            const interactive = await promptInteractive(missing);
            name = name || interactive.name;
            email = email || interactive.email;
            password = password || interactive.password;
        } else {
            logger.error(
                "Missing required admin credentials. Do not use default passwords.\n" +
                "Provide them via:\n" +
                "  1. CLI arguments: npm run seed:admin -- --name \"Admin Name\" --email \"admin@example.com\" --password \"<secure_password>\"\n" +
                "  2. Positional CLI: npm run seed:admin -- \"Admin Name\" \"admin@example.com\" \"<secure_password>\"\n" +
                "  3. Environment variables: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in your .env or command execution."
            );
            process.exit(1);
        }
    }

    if (!name || !email || !password) {
        logger.error("Admin name, email, and password must all be provided and non-empty.");
        process.exit(1);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const isConnected = await connectDatabase();
    if (!isConnected) {
        logger.error("Failed to connect to the database. Seed aborted.");
        process.exit(1);
    }

    try {
        const existing = await Admin.findOne({ email: normalizedEmail });
        if (existing) {
            logger.info(
                `Admin account with email "${normalizedEmail}" already exists. Skipping seed.`
            );
            return;
        }

        const createdAdmin = await authService.createAdmin({
            name: name.trim(),
            email: normalizedEmail,
            password,
        });

        logger.info(
            `Admin successfully created: ${createdAdmin.name} (${createdAdmin.email}) [ID: ${createdAdmin.id}]`
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error(`Failed to seed admin: ${message}`);
        process.exit(1);
    } finally {
        await disconnectDatabase();
    }
};

// Execute if run directly from CLI
if (require.main === module || process.argv[1]?.includes("seedAdmin")) {
    runSeed().catch((err) => {
        logger.error(`Seed script crashed: ${err.message}`);
        process.exit(1);
    });
}
