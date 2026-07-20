"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
  ListChecks,
  BarChart2,
  FileText,
  Paperclip,
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Indicator {
  id: string
  question: string
  weight: string
  requireAttachment: boolean
}

interface RubricRow {
  id: string
  score: string
  descriptor: string
  performanceStandard: string
}

interface EvidenceItem {
  id: string
  title: string
  description: string
  requireAttachment: boolean
}

interface Quantification {
  assignedScore: string
  weightFactor: string
}

interface Criteria {
  id: string
  title: string
  domain: string
  measure: string
  weight: string
  indicators: Indicator[]
  rubrics: RubricRow[]
  evidence: EvidenceItem[]
  quantification: Quantification
  collapsed: boolean
}

type AssignmentScope = "ORGANIZATION" | "FACULTY" | "DEPARTMENT" | "PROGRAM"

interface AssignmentSelection {
  scope: AssignmentScope
  facultyIds: number[]
  departmentIds: number[]
  programIds: number[]
}

interface FrameworkHeader {
  title: string
  description: string
  version: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DESCRIPTORS = ["Outstanding", "Excellent", "Very Good", "Good", "Satisfactory"]

const uid = () => Math.random().toString(36).slice(2, 9)

const newIndicator = (): Indicator => ({ id: uid(), question: "", weight: "", requireAttachment: false })

const newRubricRow = (): RubricRow => ({ id: uid(), score: "", descriptor: "", performanceStandard: "" })

const newEvidence = (): EvidenceItem => ({ id: uid(), title: "", description: "", requireAttachment: false })

const newCriteria = (): Criteria => ({
  id: uid(),
  title: "",
  domain: "",
  measure: "",
  weight: "",
  indicators: [newIndicator()],
  rubrics: [newRubricRow()],
  evidence: [newEvidence()],
  quantification: { assignedScore: "", weightFactor: "" },
  collapsed: false,
})

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function redistributeWeights(indicators: Indicator[], criteriaWeight: string): Indicator[] {
  const w = parseFloat(criteriaWeight)
  if (isNaN(w) || w <= 0 || indicators.length === 0) return indicators
  const each = 100 / indicators.length
  return indicators.map(i => ({ ...i, weight: each.toFixed(2) }))
}

function calcWeightedScore(q: Quantification): string {
  const a = parseFloat(q.assignedScore)
  const w = parseFloat(q.weightFactor)
  if (isNaN(a) || isNaN(w)) return "—"
  return (a * w).toFixed(3)
}

/* ------------------------------------------------------------------ */
/*  Shared UI primitives                                              */
/* ------------------------------------------------------------------ */

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error  && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Framework details                                        */
/* ------------------------------------------------------------------ */

function StepDetails({ header, setH, errors }: {
  header: FrameworkHeader
  setH: (p: Partial<FrameworkHeader>) => void
  errors: Record<string, string>
}) {
  const STATUS_OPTIONS = [
    { value: "DRAFT"     as const, label: "Draft",     desc: "Work in progress"  },
    { value: "PUBLISHED" as const, label: "Published", desc: "Active & available" },
    { value: "ARCHIVED"  as const, label: "Archived",  desc: "Retired"           },
  ]

  return (
    <div className="space-y-6">
      <Field label="Framework Title" required error={errors.title}>
        <Input
          placeholder="e.g. MSc Data Science Quality Appraisal Framework"
          value={header.title}
          onChange={e => setH({ title: e.target.value })}
          autoFocus
        />
      </Field>

      <Field label="Description">
        <Textarea
          placeholder="Describe the purpose and scope of this framework…"
          rows={4}
          value={header.description}
          onChange={e => setH({ description: e.target.value })}
          className="resize-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-5">
        <Field label="Version" required error={errors.version} hint="Format: X.Y — e.g. 2.1">
          <Input
            placeholder="1.0"
            value={header.version}
            onChange={e => setH({ version: e.target.value })}
            className="tabular-nums"
          />
        </Field>

        <Field label="Status">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setH({ status: opt.value })}
                className={cn(
                  "flex flex-col px-3 py-2 rounded-lg border text-left transition-all duration-150 flex-1",
                  header.status === opt.value
                    ? "border-primary bg-primary/8"
                    : "border-border hover:bg-muted/40"
                )}
              >
                <span className={cn("text-xs font-semibold", header.status === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                <span className="text-[0.625rem] text-muted-foreground mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Criteria & Indicators                                    */
/* ------------------------------------------------------------------ */

function CriteriaIndicatorCard({ criteria, index, onUpdate, onRemove, canRemove }: {
  criteria: Criteria; index: number
  onUpdate: (c: Criteria) => void; onRemove: () => void; canRemove: boolean
}) {
  const set = (p: Partial<Criteria>) => onUpdate({ ...criteria, ...p })
  const setInd = (id: string, p: Partial<Indicator>) =>
    set({ indicators: criteria.indicators.map(i => i.id === id ? { ...i, ...p } : i) })
  const setRub = (id: string, p: Partial<RubricRow>) =>
    set({ rubrics: criteria.rubrics.map(r => r.id === id ? { ...r, ...p } : r) })
  const setEv = (id: string, p: Partial<EvidenceItem>) =>
    set({ evidence: criteria.evidence.map(ev => ev.id === id ? { ...ev, ...p } : ev) })
  const setQuant = (p: Partial<Quantification>) =>
    set({ quantification: { ...criteria.quantification, ...p } })
  const ws = calcWeightedScore(criteria.quantification)

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
      className="rounded-xl border border-border/60 bg-card overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-b border-border/50 cursor-pointer"
        onClick={() => set({ collapsed: !criteria.collapsed })}>
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[0.625rem] font-bold text-primary shrink-0">
          {index + 1}
        </div>
        <p className={cn("flex-1 text-sm font-semibold truncate",
          criteria.title ? "text-foreground" : "text-muted-foreground")}>
          {criteria.title || `Criteria ${index + 1} — untitled`}
        </p>
        {canRemove && (
          <button type="button" onClick={e => { e.stopPropagation(); onRemove() }}
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 size={13} />
          </button>
        )}
        {criteria.collapsed ? <ChevronDown size={15} className="text-muted-foreground shrink-0" />
          : <ChevronUp size={15} className="text-muted-foreground shrink-0" />}
      </div>

      <AnimatePresence initial={false}>
        {!criteria.collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 py-4 space-y-5">

              {/* Basic fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Field label="Title" required>
                  <Input placeholder="e.g. Research Quality" value={criteria.title}
                    onChange={e => set({ title: e.target.value })} />
                </Field>
                <Field label="Domain" required hint="Thematic area">
                  <Input placeholder="e.g. Academic Research" value={criteria.domain}
                    onChange={e => set({ domain: e.target.value })} />
                </Field>
                <Field label="Measure" required hint="How it's evaluated">
                  <Input placeholder="e.g. Publication count" value={criteria.measure}
                    onChange={e => set({ measure: e.target.value })} />
                </Field>
                <Field label="Weight %" required hint="1–100 for this criteria">
                  <Input type="number" min={1} max={100} step={0.01} placeholder="e.g. 25"
                    value={criteria.weight}
                    onChange={e => set({ weight: e.target.value, indicators: redistributeWeights(criteria.indicators, e.target.value) })}
                    className="tabular-nums" />
                </Field>
              </div>

              {/* Indicators */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks size={14} className="text-primary" />
                  <p className="text-xs font-semibold text-foreground">Indicators</p>
                  <span className="text-xs text-muted-foreground">— weights auto-calculated equally from criteria weight</span>
                </div>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_88px_150px_32px] gap-2 px-1">
                    <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground/60">Question</span>
                    <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground/60 text-right">Weight %</span>
                    <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground/60">Attachment</span>
                    <span />
                  </div>

                  <AnimatePresence>
                    {criteria.indicators.map((ind, ii) => (
                      <motion.div key={ind.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        className="grid grid-cols-[1fr_88px_150px_32px] gap-2 items-center">
                        <Input placeholder={`Question ${ii + 1}`} value={ind.question}
                          onChange={e => setInd(ind.id, { question: e.target.value })} />
                        <Input type="text" readOnly placeholder="—"
                          value={ind.weight ? `${ind.weight}%` : ""}
                          className="tabular-nums text-right bg-muted/40 text-muted-foreground cursor-default" />
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <button type="button" role="checkbox" aria-checked={ind.requireAttachment}
                            onClick={() => setInd(ind.id, { requireAttachment: !ind.requireAttachment })}
                            className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                              ind.requireAttachment ? "bg-primary border-primary" : "border-border hover:border-primary/50")}>
                            {ind.requireAttachment && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
                          </button>
                          <span className="text-xs text-muted-foreground">Require attachment</span>
                        </label>
                        <button type="button" disabled={criteria.indicators.length === 1}
                          onClick={() => set({ indicators: redistributeWeights(criteria.indicators.filter(i => i.id !== ind.id), criteria.weight) })}
                          className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:pointer-events-none">
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {criteria.weight && criteria.indicators.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Each indicator: <span className="font-semibold tabular-nums text-foreground">{(100 / criteria.indicators.length).toFixed(2)}%</span>
                    <span className="ml-1">of criteria weight ({criteria.weight}%)</span>
                  </p>
                )}

                <button type="button"
                  onClick={() => set({ indicators: redistributeWeights([...criteria.indicators, newIndicator()], criteria.weight) })}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  <Plus size={12} strokeWidth={2.5} /> Add indicator
                </button>
              </div>

              {/* Rubrics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-primary" />
                  <p className="text-xs font-semibold text-foreground">Rubrics</p>
                  <span className="text-xs text-muted-foreground">— scoring levels for this criteria</span>
                </div>

                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <div className="grid grid-cols-[72px_152px_1fr_32px] border-b border-border/50 bg-muted/30">
                    {["Score", "Descriptor", "Performance Standard", ""].map((h, i) => (
                      <div key={i} className={cn("px-3 py-2 text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground",
                        i > 0 && "border-l border-border/40")}>{h}</div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {criteria.rubrics.map((row, ri) => (
                      <motion.div key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                        className={cn("grid grid-cols-[72px_152px_1fr_32px]", ri > 0 && "border-t border-border/40")}>
                        <div className="px-2 py-1.5">
                          <input type="number" min={0} placeholder="5" value={row.score}
                            onChange={e => setRub(row.id, { score: e.target.value })}
                            className="w-full h-8 px-2 text-sm text-center tabular-nums rounded border border-transparent bg-transparent focus:border-border focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all" />
                        </div>
                        <div className="px-2 py-1.5 border-l border-border/30">
                          <select value={row.descriptor} onChange={e => setRub(row.id, { descriptor: e.target.value })}
                            className="w-full h-8 px-2 text-sm rounded border border-transparent bg-transparent focus:border-border focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all appearance-none cursor-pointer text-foreground">
                            <option value="" disabled>Select…</option>
                            {DESCRIPTORS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="px-2 py-1.5 border-l border-border/30">
                          <input type="text" placeholder="Describe expected performance…" value={row.performanceStandard}
                            onChange={e => setRub(row.id, { performanceStandard: e.target.value })}
                            className="w-full h-8 px-2 text-sm rounded border border-transparent bg-transparent focus:border-border focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all" />
                        </div>
                        <div className="flex items-center justify-center px-1 py-1.5 border-l border-border/30">
                          <button type="button" disabled={criteria.rubrics.length === 1}
                            onClick={() => set({ rubrics: criteria.rubrics.filter(r => r.id !== row.id) })}
                            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:pointer-events-none">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button type="button"
                  onClick={() => set({ rubrics: [...criteria.rubrics, newRubricRow()] })}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  <Plus size={12} strokeWidth={2.5} /> Add rubric row
                </button>
              </div>

              {/* Evidence */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip size={14} className="text-primary" />
                  <p className="text-xs font-semibold text-foreground">Evidence</p>
                  <span className="text-xs text-muted-foreground">— required evidence for this criteria</span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {criteria.evidence.map((ev, ei) => (
                      <motion.div key={ev.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        className="rounded-lg border border-border/40 p-3 space-y-2">
                        <div className="grid grid-cols-[1fr_2fr_32px] gap-2 items-start">
                          <Input placeholder={`Evidence title ${ei + 1}`} value={ev.title}
                            onChange={e => setEv(ev.id, { title: e.target.value })} />
                          <Input placeholder="Brief description of expected evidence…" value={ev.description}
                            onChange={e => setEv(ev.id, { description: e.target.value })} />
                          <button type="button" disabled={criteria.evidence.length === 1}
                            onClick={() => set({ evidence: criteria.evidence.filter(x => x.id !== ev.id) })}
                            className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:pointer-events-none">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <button type="button" role="checkbox" aria-checked={ev.requireAttachment}
                            onClick={() => setEv(ev.id, { requireAttachment: !ev.requireAttachment })}
                            className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                              ev.requireAttachment ? "bg-primary border-primary" : "border-border hover:border-primary/50")}>
                            {ev.requireAttachment && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
                          </button>
                          <span className="text-xs text-muted-foreground">Require attachment — end user must upload a document</span>
                        </label>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button type="button"
                  onClick={() => set({ evidence: [...criteria.evidence, newEvidence()] })}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  <Plus size={12} strokeWidth={2.5} /> Add evidence
                </button>
              </div>

              {/* Quantification */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 size={14} className="text-primary" />
                  <p className="text-xs font-semibold text-foreground">Quantification</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <Field label="Assigned Score" required hint="Integer score for this criteria">
                    <Input type="number" min={0} placeholder="e.g. 85"
                      value={criteria.quantification.assignedScore}
                      onChange={e => setQuant({ assignedScore: e.target.value })}
                      className="tabular-nums" />
                  </Field>

                  <Field label="Weight Factor" required hint="0.001 – 1.000">
                    <Input type="number" min={0.001} max={1} step={0.001} placeholder="e.g. 0.250"
                      value={criteria.quantification.weightFactor}
                      onChange={e => setQuant({ weightFactor: e.target.value })}
                      className="tabular-nums" />
                  </Field>

                  <div className="space-y-1.5">
                    <label className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
                      Weighted Score <span className="font-normal normal-case tracking-normal text-muted-foreground/60">(auto)</span>
                    </label>
                    <div className={cn("h-9 px-3 rounded-lg border border-border/50 bg-muted/30 flex items-center text-sm font-bold tabular-nums",
                      ws === "—" ? "text-muted-foreground" : "text-foreground")}>
                      {ws}
                      {ws !== "—" && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          = {criteria.quantification.assignedScore} × {criteria.quantification.weightFactor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StepCriteria({ criterias, setCriterias }: {
  criterias: Criteria[]; setCriterias: React.Dispatch<React.SetStateAction<Criteria[]>>
}) {
  const update = (id: string, c: Criteria) => setCriterias(prev => prev.map(x => x.id === id ? c : x))
  const remove = (id: string) => setCriterias(prev => prev.filter(x => x.id !== id))
  const add    = () => setCriterias(prev => [...prev, newCriteria()])

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {criterias.map((c, i) => (
          <CriteriaIndicatorCard key={c.id} criteria={c} index={i}
            onUpdate={updated => update(c.id, updated)}
            onRemove={() => remove(c.id)}
            canRemove={criterias.length > 1} />
        ))}
      </AnimatePresence>

      <button type="button" onClick={add}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground text-sm font-medium hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200">
        <Plus size={14} strokeWidth={2} /> Add criteria
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Framework Assignment                                     */
/* ------------------------------------------------------------------ */

interface FacultyOption { id: number; name: string; code: string }
interface DepartmentOption { id: number; name: string; code: string; faculty_id: number }
interface ProgramOption { id: number; name: string; code: string; department_id: number }

function StepAssignment({ assignment, setAssignment }: {
  assignment: AssignmentSelection
  setAssignment: React.Dispatch<React.SetStateAction<AssignmentSelection>>
}) {
  const [faculties, setFaculties]       = React.useState<FacultyOption[]>([])
  const [departments, setDepartments]   = React.useState<DepartmentOption[]>([])
  const [programs, setPrograms]         = React.useState<ProgramOption[]>([])
  const [loading, setLoading]           = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [fRes, dRes, pRes] = await Promise.all([
          fetch("/api/faculties").then(r => r.json()),
          fetch("/api/departments").then(r => r.json()),
          fetch("/api/programs").then(r => r.json()),
        ])
        if (cancelled) return
        setFaculties(fRes ?? [])
        setDepartments(dRes ?? [])
        setPrograms(pRes ?? [])
      } catch {
        /* ignore — user can still select Organization scope */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const SCOPE_OPTIONS: { value: AssignmentScope; label: string; desc: string }[] = [
    { value: "ORGANIZATION", label: "Entire Organization", desc: "Assign to all faculties, departments & programs" },
    { value: "FACULTY",      label: "Specific Faculties",   desc: "Select one or more faculties" },
    { value: "DEPARTMENT",   label: "Specific Departments", desc: "Select one or more departments" },
    { value: "PROGRAM",      label: "Specific Programs",    desc: "Select one or more programs" },
  ]

  const toggleId = (arr: number[], id: number): number[] =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]

  const selectedFacultyNames = faculties
    .filter(f => assignment.facultyIds.includes(f.id))
    .map(f => `${f.name} (${f.code})`)
  const selectedDeptNames = departments
    .filter(d => assignment.departmentIds.includes(d.id))
    .map(d => `${d.name} (${d.code})`)
  const selectedProgramNames = programs
    .filter(p => assignment.programIds.includes(p.id))
    .map(p => `${p.name} (${p.code})`)

  return (
    <div className="space-y-6">
      {/* Scope selector */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-primary" />
          <p className="text-xs font-semibold text-foreground">Assignment Scope</p>
          <span className="text-xs text-muted-foreground">— choose where this framework applies</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCOPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAssignment(prev => ({
                ...prev,
                scope: opt.value,
                facultyIds: opt.value === "FACULTY" ? prev.facultyIds : [],
                departmentIds: opt.value === "DEPARTMENT" ? prev.departmentIds : [],
                programIds: opt.value === "PROGRAM" ? prev.programIds : [],
              }))}
              className={cn(
                "flex flex-col px-4 py-3 rounded-xl border text-left transition-all duration-150",
                assignment.scope === opt.value
                  ? "border-primary bg-primary/8"
                  : "border-border hover:bg-muted/40"
              )}
            >
              <span className={cn("text-sm font-semibold",
                assignment.scope === opt.value ? "text-primary" : "text-foreground")}>
                {opt.label}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Organization scope — no selection needed */}
      {assignment.scope === "ORGANIZATION" && (
        <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-6 text-center">
          <Building2 size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">This framework will be assigned to the entire organization</p>
          <p className="text-xs text-muted-foreground mt-1">All faculties, departments, and programs will have access.</p>
        </div>
      )}

      {/* Faculty selection */}
      {assignment.scope === "FACULTY" && (
        <div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : faculties.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No faculties found. Please create faculties first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {faculties.map(f => {
                const checked = assignment.facultyIds.includes(f.id)
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAssignment(prev => ({ ...prev, facultyIds: toggleId(prev.facultyIds, f.id) }))}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 text-left",
                      checked ? "border-primary bg-primary/8" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      checked ? "bg-primary border-primary" : "border-border")}>
                      {checked && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.code}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Department selection */}
      {assignment.scope === "DEPARTMENT" && (
        <div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : departments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No departments found. Please create departments first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {departments.map(d => {
                const checked = assignment.departmentIds.includes(d.id)
                const faculty = faculties.find(f => f.id === d.faculty_id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setAssignment(prev => ({ ...prev, departmentIds: toggleId(prev.departmentIds, d.id) }))}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 text-left",
                      checked ? "border-primary bg-primary/8" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      checked ? "bg-primary border-primary" : "border-border")}>
                      {checked && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.code} · {faculty?.name ?? "—"}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Program selection */}
      {assignment.scope === "PROGRAM" && (
        <div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No programs found. Please create programs first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {programs.map(p => {
                const checked = assignment.programIds.includes(p.id)
                const dept = departments.find(d => d.id === p.department_id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAssignment(prev => ({ ...prev, programIds: toggleId(prev.programIds, p.id) }))}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 text-left",
                      checked ? "border-primary bg-primary/8" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      checked ? "bg-primary border-primary" : "border-border")}>
                      {checked && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.code} · {dept?.name ?? "—"}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {assignment.scope !== "ORGANIZATION" && (
        <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
          <p className="text-xs font-semibold text-foreground mb-2">Selected Summary</p>
          {assignment.scope === "FACULTY" && (
            selectedFacultyNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedFacultyNames.map(n => (
                  <span key={n} className="px-2 py-0.5 rounded-md bg-primary/10 text-xs font-medium text-primary">{n}</span>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">No faculties selected yet.</p>
          )}
          {assignment.scope === "DEPARTMENT" && (
            selectedDeptNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedDeptNames.map(n => (
                  <span key={n} className="px-2 py-0.5 rounded-md bg-primary/10 text-xs font-medium text-primary">{n}</span>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">No departments selected yet.</p>
          )}
          {assignment.scope === "PROGRAM" && (
            selectedProgramNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedProgramNames.map(n => (
                  <span key={n} className="px-2 py-0.5 rounded-md bg-primary/10 text-xs font-medium text-primary">{n}</span>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">No programs selected yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step indicator bar                                                */
/* ------------------------------------------------------------------ */

const STEPS = [
  { id: 1, label: "Framework Details", icon: FileText,    desc: "Title, version & status" },
  { id: 2, label: "Criteria",          icon: ListChecks,  desc: "Criteria, indicators, rubrics, evidence & scoring" },
  { id: 3, label: "Assignment",        icon: Building2,   desc: "Assign to organization, faculties, departments or programs" },
]

function StepBar({ current, completed }: { current: number; completed: Set<number> }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done   = completed.has(step.id)
        const active = current === step.id
        const Icon   = step.icon
        return (
          <React.Fragment key={step.id}>
            <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              active ? "bg-primary/8 border border-primary/20" : "opacity-50")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                done   ? "bg-emerald-500 text-white"
                : active ? "bg-primary text-primary-foreground"
                         : "bg-muted text-muted-foreground")}>
                {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />}
              </div>
              <div className="hidden sm:block">
                <p className={cn("text-xs font-semibold leading-none", active ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </p>
                <p className="text-[0.625rem] text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>

            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-1 transition-colors",
                completed.has(step.id) ? "bg-emerald-400/50" : "bg-border/60")} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main FrameworkCreator (wizard)                                    */
/* ------------------------------------------------------------------ */

export function FrameworkCreator() {
  const router = useRouter()

  const [step, setStep]         = React.useState(1)
  const [completed, setCompleted] = React.useState<Set<number>>(new Set())

  const [header, setHeader] = React.useState<FrameworkHeader>({
    title: "", description: "", version: "1.0", status: "DRAFT",
  })
  const [criterias, setCriterias] = React.useState<Criteria[]>([newCriteria()])
  const [assignment, setAssignment] = React.useState<AssignmentSelection>({
    scope: "ORGANIZATION", facultyIds: [], departmentIds: [], programIds: [],
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors]         = React.useState<Record<string, string>>({})

  const setH = (p: Partial<FrameworkHeader>) => setHeader(h => ({ ...h, ...p }))

  /* Per-step validation */
  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!header.title.trim())   e.title   = "Framework title is required"
      if (!header.version.trim()) e.version = "Version is required"
    }
    if (s === 2) {
      criterias.forEach((c, i) => {
        if (!c.title.trim())  e[`c${i}_title`]  = `Criteria ${i + 1}: title is required`
        if (!c.domain.trim()) e[`c${i}_domain`] = `Criteria ${i + 1}: domain is required`
        if (!c.measure.trim())e[`c${i}_measure`]= `Criteria ${i + 1}: measure is required`
        const w = parseFloat(c.weight)
        if (isNaN(w) || w < 1 || w > 100) e[`c${i}_weight`] = `Criteria ${i + 1}: weight must be between 1 and 100`
        c.indicators.forEach((ind, ii) => {
          if (!ind.question.trim()) e[`c${i}_ind${ii}`] = `Criteria ${i + 1}, indicator ${ii + 1}: question required`
        })
        c.rubrics.forEach((r, ri) => {
          if (!r.descriptor) e[`c${i}_rub${ri}_desc`] = `Criteria ${i + 1}, rubric ${ri + 1}: descriptor is required`
          if (!r.score) e[`c${i}_rub${ri}_score`] = `Criteria ${i + 1}, rubric ${ri + 1}: score is required`
        })
        c.evidence.forEach((ev, ei) => {
          if (!ev.title.trim()) e[`c${i}_ev${ei}`] = `Criteria ${i + 1}, evidence ${ei + 1}: title is required`
        })
        const as = parseFloat(c.quantification.assignedScore)
        const wf = parseFloat(c.quantification.weightFactor)
        if (isNaN(as)) e[`c${i}_as`] = `Criteria ${i + 1}: assigned score is required`
        if (isNaN(wf) || wf < 0.001 || wf > 1) e[`c${i}_wf`] = `Criteria ${i + 1}: weight factor must be between 0.001 and 1.000`
      })
    }
    if (s === 3) {
      if (assignment.scope === "FACULTY" && assignment.facultyIds.length === 0)
        e.assignment = "Select at least one faculty"
      if (assignment.scope === "DEPARTMENT" && assignment.departmentIds.length === 0)
        e.assignment = "Select at least one department"
      if (assignment.scope === "PROGRAM" && assignment.programIds.length === 0)
        e.assignment = "Select at least one program"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setCompleted(prev => new Set(prev).add(step))
    setStep(s => s + 1)
  }

  const goBack = () => {
    setErrors({})
    setStep(s => s - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(3)) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/frameworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, criterias, assignment }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? "Failed to create framework. Please try again.")
        return
      }
      toast.success(`Framework "${header.title}" created successfully`)
      router.push("/frameworks")
    } catch {
      toast.error("Network error. Please check your connection.")
    } finally {
      setSubmitting(false)
    }
  }

  const errorList = Object.values(errors)

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Step bar */}
      <StepBar current={step} completed={completed} />

      {/* Step content */}
      <div className="rounded-xl border border-border/60 bg-card p-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Step heading */}
            <div className="mb-6 pb-4 border-b border-border/50">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-primary mb-1">
                Step {step} of {STEPS.length}
              </p>
              <h2 className="text-base font-bold text-foreground">{STEPS[step - 1].label}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{STEPS[step - 1].desc}</p>
            </div>

            {/* Validation errors */}
            {errorList.length > 0 && (
              <div className="mb-5 p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2">
                <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                <div className="text-xs text-destructive space-y-0.5">
                  {errorList.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              </div>
            )}

            {step === 1 && <StepDetails header={header} setH={setH} errors={errors} />}
            {step === 2 && <StepCriteria criterias={criterias} setCriterias={setCriterias} />}
            {step === 3 && <StepAssignment assignment={assignment} setAssignment={setAssignment} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between mt-5 pt-5 border-t border-border/60">
        <Button type="button" variant="ghost"
          onClick={step === 1 ? () => router.back() : goBack}
          disabled={submitting}>
          {step > 1 && <ArrowLeft size={14} />}
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        <div className="flex items-center gap-2">
          {/* Dot indicators */}
          {STEPS.map(s => (
            <div key={s.id} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-200",
              s.id === step ? "bg-primary w-4" :
              completed.has(s.id) ? "bg-emerald-500" : "bg-border")} />
          ))}
        </div>

        {step < STEPS.length ? (
          <Button type="button" onClick={goNext}>
            Next <ArrowRight size={14} />
          </Button>
        ) : (
          <Button type="submit" disabled={submitting}>
            {submitting && (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            )}
            {submitting ? "Creating…" : <><Check size={14} /> Create Framework</>}
          </Button>
        )}
      </div>
    </form>
  )
}
