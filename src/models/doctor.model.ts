import mongoose, { Document, Schema, Model } from "mongoose";

export interface IDoctor {
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDoctorResponse {
    id: string;
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DoctorDocument extends Document, IDoctor {
    toResponse(): IDoctorResponse;
}

const doctorSchema = new Schema<DoctorDocument>(
    {
        name: {
            type: String,
            required: [true, "Doctor name is required"],
            trim: true,
            minlength: [2, "Doctor name must be at least 2 characters"],
            maxlength: [120, "Doctor name cannot exceed 120 characters"],
        },
        specialization: {
            type: String,
            required: [true, "Specialization is required"],
            trim: true,
            minlength: [2, "Specialization must be at least 2 characters"],
            maxlength: [100, "Specialization cannot exceed 100 characters"],
        },
        hospital: {
            type: String,
            required: [true, "Hospital name is required"],
            trim: true,
            minlength: [2, "Hospital name must be at least 2 characters"],
            maxlength: [150, "Hospital name cannot exceed 150 characters"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            minlength: [7, "Phone number must be at least 7 characters"],
            maxlength: [25, "Phone number cannot exceed 25 characters"],
        },
        email: {
            type: String,
            required: [true, "Doctor email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
                "Please provide a valid email address",
            ],
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "doctors",
        toJSON: {
            transform: (_doc, ret: Record<string, unknown>) => {
                ret.id = ret._id ? ret._id.toString() : undefined;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret: Record<string, unknown>) => {
                ret.id = ret._id ? ret._id.toString() : undefined;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Indexes for query optimization
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ name: 1 });
doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ specialization: 1, hospital: 1 });

doctorSchema.methods.toResponse = function (this: DoctorDocument): IDoctorResponse {
    return {
        id: this._id ? this._id.toString() : "",
        name: this.name,
        specialization: this.specialization,
        hospital: this.hospital,
        phone: this.phone,
        email: this.email,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

export const Doctor: Model<DoctorDocument> =
    mongoose.models.Doctor || mongoose.model<DoctorDocument>("Doctor", doctorSchema);

export default Doctor;
