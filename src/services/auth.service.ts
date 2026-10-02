import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { Admin, IAdminSafe } from "../models/admin.model";
import { config } from "../config/env";

export interface TokenPayload {
    adminId: string;
    email: string;
}

export interface LoginResult {
    token: string;
    admin: IAdminSafe;
}

export interface CreateAdminInput {
    name: string;
    email: string;
    password: string;
}

// Precomputed dummy hash for timing-attack mitigation when email is not found
const DUMMY_HASH = "$2b$12$e8q4W8sXN0Wk2g7e9i1q0uN0Wk2g7e9i1q0uN0Wk2g7e9i1q0uN0W";

export class AuthService {
    /**
     * Hashes a plaintext password using bcrypt with the configured work factor.
     */
    public async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, config.bcryptSaltRounds);
    }

    /**
     * Compares a plaintext password with a bcrypt hash.
     */
    public async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generates a signed JWT for an authenticated admin.
     */
    public generateToken(payload: TokenPayload): string {
        const options: SignOptions = {
            expiresIn: config.jwtExpiresIn as unknown as number, // jsonwebtoken accepts "24h" or seconds
        };
        return jwt.sign(payload, config.jwtSecret, options);
    }

    /**
     * Verifies and decodes a JWT token.
     * Throws JsonWebTokenError or TokenExpiredError if invalid.
     */
    public verifyToken(token: string): TokenPayload {
        return jwt.verify(token, config.jwtSecret) as TokenPayload;
    }

    /**
     * Authenticates an admin by email and password.
     * Returns token and safe admin profile, or null if credentials are invalid.
     * Never leaks whether the email was registered.
     */
    public async login(email: string, password: string): Promise<LoginResult | null> {
        const normalizedEmail = email.trim().toLowerCase();

        // Explicitly select passwordHash as it is hidden by default in the schema
        const admin = await Admin.findOne({ email: normalizedEmail }).select("+passwordHash");

        if (!admin || !admin.passwordHash) {
            // Execute dummy comparison to mitigate timing attacks
            await bcrypt.compare(password, DUMMY_HASH);
            return null;
        }

        const isMatch = await this.comparePassword(password, admin.passwordHash);
        if (!isMatch) {
            return null;
        }

        const payload: TokenPayload = {
            adminId: admin._id ? admin._id.toString() : "",
            email: admin.email,
        };

        const token = this.generateToken(payload);

        return {
            token,
            admin: admin.toSafeObject(),
        };
    }

    /**
     * Finds an admin by their ID, returning safe profile information.
     */
    public async getAdminById(id: string): Promise<IAdminSafe | null> {
        const admin = await Admin.findById(id);
        if (!admin) {
            return null;
        }
        return admin.toSafeObject();
    }

    /**
     * Creates a new admin account with hashed password.
     * Throws error if email already exists.
     */
    public async createAdmin(input: CreateAdminInput): Promise<IAdminSafe> {
        const normalizedEmail = input.email.trim().toLowerCase();

        const existing = await Admin.findOne({ email: normalizedEmail });
        if (existing) {
            throw new Error(`Admin with email ${normalizedEmail} already exists`);
        }

        const passwordHash = await this.hashPassword(input.password);

        const admin = new Admin({
            name: input.name.trim(),
            email: normalizedEmail,
            passwordHash,
        });

        await admin.save();
        return admin.toSafeObject();
    }
}

export const authService = new AuthService();
export default authService;
