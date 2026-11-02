"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deleteDraft,
  fetchAssignedFrameworks,
  fetchProfile,
  fetchSubmission,
  saveSubmission,
  startSubmission,
  type AnswerPayload,
} from "./api"

const KEYS = {
  profile: ["faculty", "profile"] as const,
  frameworks: ["faculty", "frameworks"] as const,
  submission: (id: number) => ["faculty", "submission", id] as const,
}

export function useProfile() {
  return useQuery({ queryKey: KEYS.profile, queryFn: fetchProfile })
}

export function useAssignedFrameworks() {
  return useQuery({ queryKey: KEYS.frameworks, queryFn: fetchAssignedFrameworks })
}

export function useSubmission(id: number) {
  return useQuery({ queryKey: KEYS.submission(id), queryFn: () => fetchSubmission(id) })
}

export function useStartSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (frameworkId: number) => startSubmission(frameworkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.profile }),
  })
}

export function useSaveSubmission(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ action, answers }: { action: "save" | "submit"; answers: AnswerPayload[] }) =>
      saveSubmission(id, action, answers),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.submission(id) })
      qc.invalidateQueries({ queryKey: KEYS.profile })
    },
  })
}

export function useDeleteDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDraft(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.profile }),
  })
}
