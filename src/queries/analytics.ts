import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface QualityTrend {
  month: string;
  target: number;
  actual: number;
  industryAvg: number;
}

export interface DepartmentScore {
  department: string;
  score: number;
  programs: number;
}

export const analyticsKeys = {
  all: ["analytics"] as const,
  trends: (year?: number) => [...analyticsKeys.all, "trends", year] as const,
  departments: () => [...analyticsKeys.all, "departments"] as const,
  summary: () => [...analyticsKeys.all, "summary"] as const,
};

export function useQualityTrends(year?: number) {
  return useQuery({
    queryKey: analyticsKeys.trends(year),
    queryFn: async () => {
      const { data } = await axios.get<QualityTrend[]>(`${API_BASE}/analytics/trends`, {
        params: { year },
      });
      return data;
    },
  });
}

export function useDepartmentScores() {
  return useQuery({
    queryKey: analyticsKeys.departments(),
    queryFn: async () => {
      const { data } = await axios.get<DepartmentScore[]>(`${API_BASE}/analytics/departments`);
      return data;
    },
  });
}
