/**
 * Client-side API helpers.
 *
 * API errors use the standard shape { error: { code, message, details? } }.
 * apiClient unwraps it and throws a typed ApiError; errorMessage() tolerates
 * the legacy flat { error: "msg" } shape for code that hasn't migrated yet.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function errorMessage(body: unknown, fallback = "Something went wrong"): string {
  if (body && typeof body === "object" && "error" in body) {
    const e = (body as { error?: unknown }).error
    if (typeof e === "string") return e
    if (e && typeof e === "object" && "message" in e) {
      return String((e as { message: unknown }).message)
    }
  }
  return fallback
}

export async function apiClient<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init)
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const e =
      body && typeof body === "object" && "error" in body
        ? (body as { error?: { code?: string; message?: string; details?: unknown } }).error
        : undefined
    throw new ApiError(
      res.status,
      e?.code ?? "UNKNOWN",
      e?.message ?? `Request failed (${res.status})`,
      e?.details
    )
  }
  return body as T
}
