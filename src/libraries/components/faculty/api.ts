/**
 * Faculty-side fetchers + response normalizers.
 * This is the only file that knows the wire shapes — components work with
 * the normalized types from @/types. All requests go through apiClient,
 * which unwraps the standard { error: { code, message } } shape.
 */
import { apiClient } from "@/lib/api"
import type {
  EmpProfile,
  SubmissionAnswer,
  SubmissionDetail,
  SubmissionSummary,
} from "@/types"

export interface AssignedFramework {
  id: number
  title: string
  description: string | null
  version: string
  criteria_count: number
  indicator_count: number
  updated_at: string
}

export interface ProfileData {
  /** null when the signed-in user has no SAP employee record (pure admin). */
  profile: EmpProfile | null
  submissions: SubmissionSummary[]
}

export interface StartSubmissionResult {
  id: number
  existing?: boolean
}

export interface SaveResult {
  success: boolean
  status: "DRAFT" | "SUBMITTED"
  progress: number
  total_score: number | null
}

export type AnswerPayload = Pick<
  SubmissionAnswer,
  "indicator_id" | "rubric_id" | "response" | "attachment_name" | "attachment_type" | "attachment_data"
>

export function fetchProfile() {
  return apiClient<ProfileData>("/api/profile")
}

export async function fetchAssignedFrameworks() {
  const data = await apiClient<{ frameworks: AssignedFramework[] }>("/api/profile/frameworks")
  return data.frameworks
}

export function fetchSubmission(id: number) {
  return apiClient<SubmissionDetail>(`/api/submissions/${id}`)
}

export function startSubmission(frameworkId: number) {
  return apiClient<StartSubmissionResult>("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ framework_id: frameworkId }),
  })
}

export function saveSubmission(id: number, action: "save" | "submit", answers: AnswerPayload[]) {
  return apiClient<SaveResult>(`/api/submissions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, answers }),
  })
}

export function deleteDraft(id: number) {
  return apiClient<{ success: boolean }>(`/api/submissions/${id}`, { method: "DELETE" })
}
