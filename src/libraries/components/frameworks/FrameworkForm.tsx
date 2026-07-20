"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Framework } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const frameworkSchema = z.object({
  title:       z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be under 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be under 1000 characters"),
  version:     z.string().min(1, "Version is required").regex(/^\d+\.\d+$/, "Version must be in format X.Y (e.g. 1.0)"),
  status:      z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

type FrameworkFormData = z.infer<typeof frameworkSchema>;

interface FrameworkFormProps {
  initialData?: Partial<Framework>;
  mode: "create" | "edit";
}

const STATUS_OPTIONS: Array<{ value: Framework["status"]; label: string; description: string }> = [
  { value: "DRAFT",     label: "Draft",     description: "Work in progress, not yet active" },
  { value: "PUBLISHED", label: "Published", description: "Active and available for appraisals" },
  { value: "ARCHIVED",  label: "Archived",  description: "Retired, no longer in use" },
];

export function FrameworkForm({ initialData, mode }: FrameworkFormProps) {
  const router = useRouter();

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FrameworkFormData>({
    resolver: zodResolver(frameworkSchema),
    defaultValues: {
      title:       initialData?.title       ?? "",
      description: initialData?.description ?? "",
      version:     initialData?.version     ?? "1.0",
      status:      initialData?.status      ?? "DRAFT",
    },
  });

  const selectedStatus = watch("status");

  async function onSubmit(data: FrameworkFormData) {
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success(mode === "create" ? `Framework "${data.title}" created` : `Framework "${data.title}" updated`);
      router.push("/frameworks");
    } catch {
      toast.error("Failed to save framework. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8 max-w-xl">

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="title"
          placeholder="e.g. MSc Data Science Quality Framework"
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          {...register("title")}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-xs text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="description"
          placeholder="Describe the purpose and scope of this framework..."
          rows={3}
          aria-required="true"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          {...register("description")}
          className="resize-none"
        />
        {errors.description && (
          <p id="description-error" role="alert" className="text-xs text-destructive mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Version */}
      <div className="space-y-1.5">
        <Label htmlFor="version">Version <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="version"
          placeholder="1.0"
          aria-required="true"
          aria-invalid={!!errors.version}
          aria-describedby={errors.version ? "version-error" : "version-hint"}
          {...register("version")}
          className="w-28 tabular-nums"
        />
        {errors.version ? (
          <p id="version-error" role="alert" className="text-xs text-destructive mt-1">{errors.version.message}</p>
        ) : (
          <p id="version-hint" className="text-xs text-muted-foreground mt-1">Format: X.Y — e.g. 2.1</p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label>Status</Label>
        <div role="radiogroup" aria-label="Framework status" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex flex-col gap-1 p-4 rounded-lg cursor-pointer border transition-colors",
                selectedStatus === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <input
                type="radio"
                className="sr-only"
                value={opt.value}
                checked={selectedStatus === opt.value}
                onChange={() => setValue("status", opt.value, { shouldValidate: true })}
                aria-label={opt.label}
              />
              <span className={cn("text-sm font-medium", selectedStatus === opt.value ? "text-primary" : "text-foreground")}>
                {opt.label}
              </span>
              <span className="text-xs text-muted-foreground">{opt.description}</span>
            </label>
          ))}
        </div>
        {errors.status && (
          <p role="alert" className="text-xs text-destructive mt-1">{errors.status.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting && <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
          {isSubmitting ? (mode === "create" ? "Creating…" : "Saving…") : (mode === "create" ? "Create Framework" : "Save Changes")}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
