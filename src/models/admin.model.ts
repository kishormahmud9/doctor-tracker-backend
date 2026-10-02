import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAdmin {
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAdminSafe {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AdminDocument extends Document, Omit<IAdmin, "passwordHash"> {
    passwordHash?: string;
    toSafeObject(): IAdminSafe;
}

const adminSchema = new Schema<AdminDocument>(
    {
        name: {
            type: String,
            required: [true, "Admin name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Admin email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
                "Please provide a valid email address",
            ],
            index: true,
        },
        passwordHash: {
            type: String,
            required: [true, "Password hash is required"],
            select: false, // Defense-in-depth: excluded from default queries
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: Record<string, unknown>) => {
                ret.id = ret._id ? ret._id.toString() : undefined;
                delete ret._id;
                delete ret.passwordHash;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret: Record<string, unknown>) => {
                ret.id = ret._id ? ret._id.toString() : undefined;
                delete ret._id;
                delete ret.passwordHash;
                delete ret.__v;
                return ret;
            },
        },
    }
);

adminSchema.methods.toSafeObject = function (this: AdminDocument): IAdminSafe {
    return {
        id: this._id ? this._id.toString() : "",
        name: this.name,
        email: this.email,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

export const Admin: Model<AdminDocument> =
    mongoose.models.Admin || mongoose.model<AdminDocument>("Admin", adminSchema);

export default Admin;
