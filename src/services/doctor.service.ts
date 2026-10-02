import { Doctor, IDoctorResponse } from "../models/doctor.model";
import { Patient } from "../models/patient.model";

export interface CreateDoctorInput {
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
}

export interface UpdateDoctorInput {
    name?: string;
    specialization?: string;
    hospital?: string;
    phone?: string;
    email?: string;
}

export interface GetDoctorsQuery {
    page?: number;
    limit?: number;
    search?: string;
    specialization?: string;
    hospital?: string;
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

export interface GetDoctorsResult {
    doctors: IDoctorResponse[];
    pagination: PaginationMeta;
}

export interface DeleteDoctorResult {
    deleted: boolean;
    notFound?: boolean;
    reason?: string;
}

export class DuplicateDoctorEmailError extends Error {
    constructor(email: string) {
        super(`Doctor with email "${email}" already exists`);
        this.name = "DuplicateDoctorEmailError";
    }
}

const escapeRegex = (str: string): string => {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export class DoctorService {
    /**
     * Creates a new doctor record.
     * Throws DuplicateDoctorEmailError if email is already taken.
     */
    public async createDoctor(input: CreateDoctorInput): Promise<IDoctorResponse> {
        const normalizedEmail = input.email.trim().toLowerCase();

        const existing = await Doctor.findOne({ email: normalizedEmail });
        if (existing) {
            throw new DuplicateDoctorEmailError(normalizedEmail);
        }

        const doctor = new Doctor({
            name: input.name.trim(),
            specialization: input.specialization.trim(),
            hospital: input.hospital.trim(),
            phone: input.phone.trim(),
            email: normalizedEmail,
        });

        await doctor.save();
        return doctor.toResponse();
    }

    /**
     * Retrieves doctors with pagination, multi-field search, and filtering.
     * Uses efficient countDocuments and limit/skip cursors.
     */
    public async getDoctors(query: GetDoctorsQuery): Promise<GetDoctorsResult> {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 10));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};

        // Filter by exact (case-insensitive) specialization
        if (query.specialization && query.specialization.trim()) {
            filter.specialization = {
                $regex: `^${escapeRegex(query.specialization.trim())}$`,
                $options: "i",
            };
        }

        // Filter by exact (case-insensitive) hospital
        if (query.hospital && query.hospital.trim()) {
            filter.hospital = {
                $regex: `^${escapeRegex(query.hospital.trim())}$`,
                $options: "i",
            };
        }

        // Search across name, specialization, hospital, and email
        if (query.search && query.search.trim()) {
            const searchRegex = {
                $regex: escapeRegex(query.search.trim()),
                $options: "i",
            };
            filter.$or = [
                { name: searchRegex },
                { specialization: searchRegex },
                { hospital: searchRegex },
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
                    // If YYYY-MM-DD string, include until end of the day (23:59:59.999Z)
                    end.setUTCHours(23, 59, 59, 999);
                }
                dateFilter.$lte = end;
            }
            filter.createdAt = dateFilter;
        }

        const [totalRecords, doctorDocs] = await Promise.all([
            Doctor.countDocuments(filter),
            Doctor.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        const totalPages = Math.ceil(totalRecords / limit) || 1;

        return {
            doctors: doctorDocs.map((doc) => doc.toResponse()),
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
     * Retrieves a single doctor by MongoDB ID.
     */
    public async getDoctorById(id: string): Promise<IDoctorResponse | null> {
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return null;
        }
        return doctor.toResponse();
    }

    /**
     * Updates an existing doctor.
     * Throws DuplicateDoctorEmailError if updated email is in use by another doctor.
     */
    public async updateDoctor(
        id: string,
        updates: UpdateDoctorInput
    ): Promise<IDoctorResponse | null> {
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return null;
        }

        if (updates.email) {
            const normalizedEmail = updates.email.trim().toLowerCase();
            if (normalizedEmail !== doctor.email) {
                const existingWithEmail = await Doctor.findOne({
                    email: normalizedEmail,
                    _id: { $ne: id },
                });
                if (existingWithEmail) {
                    throw new DuplicateDoctorEmailError(normalizedEmail);
                }
                doctor.email = normalizedEmail;
            }
        }

        if (updates.name !== undefined) doctor.name = updates.name.trim();
        if (updates.specialization !== undefined) doctor.specialization = updates.specialization.trim();
        if (updates.hospital !== undefined) doctor.hospital = updates.hospital.trim();
        if (updates.phone !== undefined) doctor.phone = updates.phone.trim();

        await doctor.save();
        return doctor.toResponse();
    }

    /**
     * Policy check: verifies whether a doctor can be safely deleted.
     * Prevents deleting a doctor who still has associated patients.
     */
    public async canDeleteDoctor(
        id: string
    ): Promise<{ canDelete: boolean; reason?: string }> {
        const patientCount = await Patient.countDocuments({ doctorId: id });
        if (patientCount > 0) {
            return {
                canDelete: false,
                reason: `Cannot delete doctor with ${patientCount} associated patient(s). Reassign or delete associated patients first.`,
            };
        }
        return { canDelete: true };
    }

    /**
     * Safely deletes a doctor after verifying foreign key / patient constraints.
     */
    public async deleteDoctor(id: string): Promise<DeleteDoctorResult> {
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return { deleted: false, notFound: true };
        }

        const { canDelete, reason } = await this.canDeleteDoctor(id);
        if (!canDelete) {
            return { deleted: false, reason: reason || "Deletion prevented by active association" };
        }

        await Doctor.findByIdAndDelete(id);
        return { deleted: true };
    }
}

export const doctorService = new DoctorService();
export default doctorService;
