import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface Program {
  id: string;
  name: string;
  code: string;
  level: "masters" | "phd" | "postdoc";
  department: string;
  coordinator: string;
  accreditationStatus: "accredited" | "pending" | "not-accredited";
  enrolledStudents: number;
  qualityScore?: number;
}

export const programKeys = {
  all: ["programs"] as const,
  lists: () => [...programKeys.all, "list"] as const,
  detail: (id: string) => [...programKeys.all, id] as const,
};

export function usePrograms() {
  return useQuery({
    queryKey: programKeys.lists(),
    queryFn: async () => {
      const { data } = await axios.get<Program[]>(`${API_BASE}/programs`);
      return data;
    },
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: async () => {
      const { data } = await axios.get<Program>(`${API_BASE}/programs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Program, "id">) => {
      const { data } = await axios.post<Program>(`${API_BASE}/programs`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
  });
}
