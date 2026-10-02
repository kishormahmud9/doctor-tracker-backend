import { Types } from "mongoose";
import { Patient, IPatientResponse, PatientGender } from "../models/patient.model";
import { Doctor } from "../models/doctor.model";

export interface CreatePatientInput {
    name: string;
    age: number;
    gender: PatientGender;
    phone: string;
    condition: string;
    doctorId: string;
    email?: string;
}

export interface UpdatePatientInput {
    name?: string;
    age?: number;
    gender?: PatientGender;
    phone?: string;
    condition?: string;
    doctorId?: string;
    email?: string;
}

export interface GetPatientsQuery {
    page?: number;
    limit?: number;
    search?: string;
    doctorId?: string;
    condition?: string;
    startDate?: string;
    endDate?: string;
}

export interface PaginationMeta {
    totalRecords: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface GetPatientsResult {
    patients: IPatientResponse[];
    pagination: PaginationMeta;
}

export interface DeleteDoctorPatientResult {
    success: boolean;
    errorType?: "DOCTOR_NOT_FOUND" | "PATIENT_NOT_FOUND" | "MISMATCH";
    message?: string;
}

export class ReferencedDoctorNotFoundError extends Error {
    constructor(doctorId: string) {
        super(`Referenced doctor with ID "${doctorId}" not found`);
        this.name = "ReferencedDoctorNotFoundError";
    }
}

const escapeRegex = (str: string): string => {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export class PatientService {
    /**
     * Creates a new patient associated with a valid existing doctor.
     * Throws ReferencedDoctorNotFoundError if doctor does not exist.
     */
    public async createPatient(input: CreatePatientInput): Promise<IPatientResponse> {
        const doctorExists = await Doctor.exists({ _id: input.doctorId });
        if (!doctorExists) {
            throw new ReferencedDoctorNotFoundError(input.doctorId);
        }

        const patient = new Patient({
            name: input.name.trim(),
            age: input.age,
            gender: input.gender,
            phone: input.phone.trim(),
            condition: input.condition.trim(),
            doctorId: new Types.ObjectId(input.doctorId),
            email: input.email ? input.email.trim().toLowerCase() : undefined,
        });

        await patient.save();
        return patient.toResponse();
    }

    /**
     * Retrieves patients with pagination, search, doctor filter, condition filter, and date filter.
     */
    public async getPatients(query: GetPatientsQuery): Promise<GetPatientsResult> {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 10));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};

        // Filter by specific doctor
        if (query.doctorId && query.doctorId.trim()) {
            filter.doctorId = new Types.ObjectId(query.doctorId.trim());
        }

        // Filter by patient condition
        if (query.condition && query.condition.trim()) {
            filter.condition = {
                $regex: `^${escapeRegex(query.condition.trim())}$`,
                $options: "i",
            };
        }

        // Search text fields (name, condition, phone, email)
        if (query.search && query.search.trim()) {
            const searchRegex = {
                $regex: escapeRegex(query.search.trim()),
                $options: "i",
            };
            filter.$or = [
                { name: searchRegex },
                { condition: searchRegex },
                { phone: searchRegex },
                { email: searchRegex },
            ];
        }

        // Date range filtering on createdAt
        if (query.startDate || query.endDate) {
            const dateFilter: Record<string, Date> = {};
            if (query.startDate) {
                dateFilter.$gte = new Date(query.startDate);
            }
            if (query.endDate) {
                const end = new Date(query.endDate);
                if (query.endDate.length === 10) {
                    end.setUTCHours(23, 59, 59, 999);
                }
                dateFilter.$lte = end;
            }
            filter.createdAt = dateFilter;
        }

        const [totalRecords, patientDocs] = await Promise.all([
            Patient.countDocuments(filter),
            Patient.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        const totalPages = Math.ceil(totalRecords / limit) || 1;

        return {
            patients: patientDocs.map((doc) => doc.toResponse()),
            pagination: {
                totalRecords,
                currentPage: page,
                pageSize: limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * Retrieves a single patient by MongoDB ID.
     */
    public async getPatientById(id: string): Promise<IPatientResponse | null> {
        const patient = await Patient.findById(id);
        if (!patient) {
            return null;
        }
        return patient.toResponse();
    }

    /**
     * Updates an existing patient.
     * If doctorId is being updated, verifies the new doctor exists.
     */
    public async updatePatient(
        id: string,
        updates: UpdatePatientInput
    ): Promise<IPatientResponse | null> {
        const patient = await Patient.findById(id);
        if (!patient) {
            return null;
        }

        if (updates.doctorId) {
            const doctorExists = await Doctor.exists({ _id: updates.doctorId });
            if (!doctorExists) {
                throw new ReferencedDoctorNotFoundError(updates.doctorId);
            }
            patient.doctorId = new Types.ObjectId(updates.doctorId);
        }

        if (updates.name !== undefined) patient.name = updates.name.trim();
        if (updates.age !== undefined) patient.age = updates.age;
        if (updates.gender !== undefined) patient.gender = updates.gender;
        if (updates.phone !== undefined) patient.phone = updates.phone.trim();
        if (updates.condition !== undefined) patient.condition = updates.condition.trim();
        if (updates.email !== undefined) {
            patient.email = updates.email ? updates.email.trim().toLowerCase() : undefined;
        }

        await patient.save();
        return patient.toResponse();
    }

    /**
     * Deletes a single patient by ID.
     */
    public async deletePatient(id: string): Promise<boolean> {
        const deleted = await Patient.findByIdAndDelete(id);
        return !!deleted;
    }

    /**
     * Deletes a patient scoped under a specific doctor, confirming ownership.
     */
    public async deleteDoctorPatient(
        doctorId: string,
        patientId: string
    ): Promise<DeleteDoctorPatientResult> {
        const doctorExists = await Doctor.exists({ _id: doctorId });
        if (!doctorExists) {
            return {
                success: false,
                errorType: "DOCTOR_NOT_FOUND",
                message: "Doctor not found",
            };
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return {
                success: false,
                errorType: "PATIENT_NOT_FOUND",
                message: "Patient not found",
            };
        }

        if (patient.doctorId.toString() !== doctorId) {
            return {
                success: false,
                errorType: "MISMATCH",
                message: "Patient does not belong to the specified doctor",
            };
        }

        await Patient.findByIdAndDelete(patientId);
        return { success: true };
    }
}

export const patientService = new PatientService();
export default patientService;
