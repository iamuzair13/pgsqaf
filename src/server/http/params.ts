import { BadRequestError } from "./errors"

/** Parses a positive-integer route param; throws BadRequestError otherwise. */
export function paramId(value: string | undefined, label = "id"): number {
  const n = Number(value)
  if (!value || !Number.isInteger(n) || n <= 0) {
    throw new BadRequestError(`Invalid ${label}`)
  }
  return n
}
