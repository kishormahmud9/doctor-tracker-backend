import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type PatientGender = "male" | "female" | "other";

export interface IPatient {
    name: string;
    age: number;
    gender: PatientGender;
    phone: string;
    condition: string;
    email?: string;
    doctorId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPatientResponse {
    id: string;
    name: string;
    age: number;
    gender: PatientGender;
    phone: string;
    condition: string;
    email?: string;
    doctorId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PatientDocument extends Document, Omit<IPatient, "doctorId"> {
    doctorId: Types.ObjectId;
    toResponse(): IPatientResponse;
}

const patientSchema = new Schema<PatientDocument>(
    {
        name: {
            type: String,
            required: [true, "Patient name is required"],
            trim: true,
            minlength: [2, "Patient name must be at least 2 characters"],
            maxlength: [120, "Patient name cannot exceed 120 characters"],
        },
        age: {
            type: Number,
            required: [true, "Patient age is required"],
            min: [0, "Age cannot be negative"],
            max: [130, "Age cannot exceed 130"],
        },
        gender: {
            type: String,
            required: [true, "Patient gender is required"],
            enum: {
                values: ["male", "female", "other"],
                message: "Gender must be 'male', 'female', or 'other'",
            },
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            minlength: [7, "Phone number must be at least 7 characters"],
            maxlength: [25, "Phone number cannot exceed 25 characters"],
        },
        condition: {
            type: String,
            required: [true, "Medical condition is required"],
            trim: true,
            minlength: [2, "Condition must be at least 2 characters"],
            maxlength: [100, "Condition cannot exceed 100 characters"],
            index: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [
                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
                "Please provide a valid email address",
            ],
            default: undefined,
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: "Doctor",
            required: [true, "Doctor association is required"],
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "patients",
        toJSON: {
            transform: (_doc, ret: Record<string, unknown>) => {
                ret.id = ret._id ? ret._id.toString() : undefined;
                if (ret.doctorId && typeof ret.doctorId === "object" && "_id" in (ret.doctorId as Record<string, unknown>)) {
                    ret.doctor = ret.doctorId;
                    delete ret.doctorId;
                } else if (ret.doctorId) {
                    ret.doctorId = ret.doctorId.toString();
                }
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            transform: (_doc, ret: Record<string, unknown>) => {
                ret.id = ret._id ? ret._id.toString() : undefined;
                if (ret.doctorId && typeof ret.doctorId === "object" && "_id" in (ret.doctorId as Record<string, unknown>)) {
                    ret.doctor = ret.doctorId;
                    delete ret.doctorId;
                } else if (ret.doctorId) {
                    ret.doctorId = ret.doctorId.toString();
                }
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Compound and sorting indexes for query optimization
patientSchema.index({ createdAt: -1 });
patientSchema.index({ doctorId: 1, condition: 1 });
patientSchema.index({ doctorId: 1, createdAt: -1 });

patientSchema.methods.toResponse = function (this: PatientDocument): IPatientResponse {
    return {
        id: this._id ? this._id.toString() : "",
        name: this.name,
        age: this.age,
        gender: this.gender,
        phone: this.phone,
        condition: this.condition,
        email: this.email,
        doctorId: this.doctorId ? this.doctorId.toString() : "",
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

export const Patient: Model<PatientDocument> =
    mongoose.models.Patient || mongoose.model<PatientDocument>("Patient", patientSchema);

export default Patient;
