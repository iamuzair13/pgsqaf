import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface Appraisal {
  id: string;
  programId: string;
  programName: string;
  evaluatorId: string;
  score: number | null;
  status: "draft" | "submitted" | "in-review" | "completed";
  evaluationDate: string;
  comments?: string;
}

export const appraisalKeys = {
  all: ["appraisals"] as const,
  lists: () => [...appraisalKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...appraisalKeys.lists(), filters] as const,
  detail: (id: string) => [...appraisalKeys.all, id] as const,
};

export function useAppraisals(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: appraisalKeys.list(filters ?? {}),
    queryFn: async () => {
      const { data } = await axios.get<Appraisal[]>(`${API_BASE}/appraisals`, {
        params: filters,
      });
      return data;
    },
  });
}

export function useAppraisal(id: string) {
  return useQuery({
    queryKey: appraisalKeys.detail(id),
    queryFn: async () => {
      const { data } = await axios.get<Appraisal>(`${API_BASE}/appraisals/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAppraisal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Appraisal, "id">) => {
      const { data } = await axios.post<Appraisal>(`${API_BASE}/appraisals`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appraisalKeys.lists() });
    },
  });
}

export function useUpdateAppraisal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Appraisal> & { id: string }) => {
      const { data } = await axios.patch<Appraisal>(`${API_BASE}/appraisals/${id}`, payload);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: appraisalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: appraisalKeys.lists() });
    },
  });
}
