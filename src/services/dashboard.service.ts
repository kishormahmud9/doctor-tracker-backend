import { PipelineStage } from "mongoose";
import { Doctor } from "../models/doctor.model";
import { Patient } from "../models/patient.model";

export interface DashboardSummaryResult {
    totalDoctors: number;
    totalPatients: number;
    averagePatientsPerDoctor: number;
    range?: {
        startDate?: string;
        endDate?: string;
        doctorsInRange: number;
        patientsInRange: number;
    };
}

export interface DoctorPatientCountItem {
    doctorId: string;
    doctorName: string;
    specialization: string;
    hospital: string;
    patientCount: number;
}

export interface DateStatisticItem {
    date: string;
    doctorsCreated: number;
    patientsCreated: number;
}

export interface DateStatisticsResult {
    timeline: DateStatisticItem[];
    summary: {
        groupBy: "day" | "month";
        timezone: string;
        startDate?: string;
        endDate?: string;
        totalDoctorsInRange: number;
        totalPatientsInRange: number;
    };
}

export interface DateFilterQuery {
    startDate?: string;
    endDate?: string;
    groupBy?: "day" | "month";
    timezone?: string;
}

export class DashboardService {
    /**
     * Retrieves overall system counts and average patients per doctor.
     * If a date range is supplied, returns both overall counts and range-specific metrics.
     */
    public async getSummary(query?: DateFilterQuery): Promise<DashboardSummaryResult> {
        const [totalDoctors, totalPatients] = await Promise.all([
            Doctor.countDocuments(),
            Patient.countDocuments(),
        ]);

        const averagePatientsPerDoctor =
            totalDoctors > 0 ? Number((totalPatients / totalDoctors).toFixed(2)) : 0;

        let rangeInfo: DashboardSummaryResult["range"];

        if (query?.startDate || query?.endDate) {
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

            const [doctorsInRange, patientsInRange] = await Promise.all([
                Doctor.countDocuments({ createdAt: dateFilter }),
                Patient.countDocuments({ createdAt: dateFilter }),
            ]);

            rangeInfo = {
                startDate: query.startDate,
                endDate: query.endDate,
                doctorsInRange,
                patientsInRange,
            };
        }

        return {
            totalDoctors,
            totalPatients,
            averagePatientsPerDoctor,
            ...(rangeInfo ? { range: rangeInfo } : {}),
        };
    }

    /**
     * Computes the number of patients assigned to each doctor.
     * Uses an optimized aggregation subpipeline with $count to avoid memory bloat.
     * Preserves doctors with zero patients (count = 0) and avoids double-counting.
     */
    public async getPatientsPerDoctor(): Promise<DoctorPatientCountItem[]> {
        const pipeline: PipelineStage[] = [
            {
                $lookup: {
                    from: "patients",
                    let: { docId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$doctorId", "$$docId"] },
                            },
                        },
                        {
                            $count: "count",
                        },
                    ],
                    as: "patientStats",
                },
            },
            {
                $project: {
                    _id: 0,
                    doctorId: { $toString: "$_id" },
                    doctorName: "$name",
                    specialization: "$specialization",
                    hospital: "$hospital",
                    patientCount: {
                        $ifNull: [{ $arrayElemAt: ["$patientStats.count", 0] }, 0],
                    },
                },
            },
            {
                $sort: { patientCount: -1, doctorName: 1 },
            },
        ];

        const results = await Doctor.aggregate<DoctorPatientCountItem>(pipeline);
        return results;
    }

    /**
     * Generates time-series statistics of doctor and patient registrations
     * based on their createdAt timestamps.
     * Dates are grouped in UTC (by day: YYYY-MM-DD, or by month: YYYY-MM).
     */
    public async getDateStatistics(query?: DateFilterQuery): Promise<DateStatisticsResult> {
        const groupBy = (query?.groupBy?.toLowerCase() === "month" ? "month" : "day") as "day" | "month";
        const dateFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";
        const timezone = query?.timezone || "UTC";

        const dateFilter: Record<string, Date> = {};
        if (query?.startDate) {
            dateFilter.$gte = new Date(query.startDate);
        }
        if (query?.endDate) {
            const end = new Date(query.endDate);
            if (query.endDate.length === 10) {
                end.setUTCHours(23, 59, 59, 999);
            }
            dateFilter.$lte = end;
        }

        const hasDateFilter = Object.keys(dateFilter).length > 0;
        const matchStage: PipelineStage.Match | null = hasDateFilter
            ? { $match: { createdAt: dateFilter } }
            : null;

        const buildPipeline = (): PipelineStage[] => {
            const steps: PipelineStage[] = [];
            if (matchStage) {
                steps.push(matchStage);
            }
            steps.push(
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: dateFormat,
                                date: "$createdAt",
                                timezone,
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { _id: 1 },
                }
            );
            return steps;
        };

        const [doctorAgg, patientAgg] = await Promise.all([
            Doctor.aggregate<{ _id: string; count: number }>(buildPipeline()),
            Patient.aggregate<{ _id: string; count: number }>(buildPipeline()),
        ]);

        // Merge into a continuous ordered map keyed by date string
        const dateMap = new Map<string, { doctorsCreated: number; patientsCreated: number }>();

        for (const doc of doctorAgg) {
            if (doc._id) {
                dateMap.set(doc._id, { doctorsCreated: doc.count, patientsCreated: 0 });
            }
        }

        for (const pat of patientAgg) {
            if (pat._id) {
                const existing = dateMap.get(pat._id) || { doctorsCreated: 0, patientsCreated: 0 };
                existing.patientsCreated = pat.count;
                dateMap.set(pat._id, existing);
            }
        }

        // Sort ascending by date string
        const sortedDates = Array.from(dateMap.keys()).sort();
        const timeline: DateStatisticItem[] = sortedDates.map((date) => ({
            date,
            doctorsCreated: dateMap.get(date)!.doctorsCreated,
            patientsCreated: dateMap.get(date)!.patientsCreated,
        }));

        const totalDoctorsInRange = timeline.reduce((acc, curr) => acc + curr.doctorsCreated, 0);
        const totalPatientsInRange = timeline.reduce((acc, curr) => acc + curr.patientsCreated, 0);

        return {
            timeline,
            summary: {
                groupBy,
                timezone,
                startDate: query?.startDate,
                endDate: query?.endDate,
                totalDoctorsInRange,
                totalPatientsInRange,
            },
        };
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
