"use client"

import * as React from "react"
import { Paperclip, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // server cap applies to base64 (~3.8 MB of real file)

export interface AttachmentValue {
  name: string | null
  type: string | null
  data: string | null
}

interface AttachmentFieldProps {
  value: AttachmentValue | null
  required?: boolean
  disabled?: boolean
  onChange: (value: AttachmentValue) => void
}

/**
 * File → data URL, stored in the PATCH payload (matching the current API).
 * Will move to real file storage per CONTEXT.md §4.5 — the API surface
 * stays the same when that lands.
 */
export function AttachmentField({ value, required, disabled, onChange }: AttachmentFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Attachments must be 5 MB or smaller")
      return
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Unable to read file"))
      reader.readAsDataURL(file)
    })
    onChange({ name: file.name, type: file.type, data })
  }

  if (value?.name) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs">
        <Paperclip size={12} className="text-muted-foreground" />
        <span className="max-w-52 truncate font-medium">{value.name}</span>
        {!disabled && (
          <button
            type="button"
            aria-label="Remove attachment"
            onClick={() => onChange({ name: null, type: null, data: null })}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium",
          "text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors",
          "disabled:cursor-default disabled:opacity-50",
          required && "border-warning/60 text-warning"
        )}
      >
        <Paperclip size={12} />
        {required ? "Attachment required — choose file" : "Attach evidence"}
      </button>
      {required && (
        <p className="mt-1 flex items-center gap-1 text-[0.6875rem] text-warning">
          <AlertCircle size={11} /> This indicator can&rsquo;t be submitted without a file
        </p>
      )}
    </div>
  )
}
