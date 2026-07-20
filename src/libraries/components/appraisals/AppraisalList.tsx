"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Eye,
  Building2,
  Layers,
  BookMarked,
  Check,
  X,
  ListFilter,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Status = "Completed" | "In Review" | "Pending" | "Rejected"
type SortKey = "sapId" | "name" | "email" | "status" | "score" | "date" | "faculty" | "department" | "program"
type SortDir = "asc" | "desc"

interface Appraisal {
  id: number
  sapId: string
  name: string
  email: string
  status: Status
  score: number | null
  date: Date
  faculty: string
  department: string
  program: string
}

/* ------------------------------------------------------------------ */
/*  Mock data (replace with real API call)                            */
/* ------------------------------------------------------------------ */

const appraisals: Appraisal[] = [
  {
    id: 1,
    sapId: "2025-001",
    name: "Ayesha Khan",
    email: "ayesha.khan@student.uol.edu.pk",
    status: "Completed",
    score: 88,
    date: new Date("2025-07-10"),
    faculty: "Faculty of Computing & Technology",
    department: "Department of Computer Science",
    program: "MSc Data Science",
  },
  {
    id: 2,
    sapId: "2025-002",
    name: "Bilal Ahmed",
    email: "bilal.ahmed@student.uol.edu.pk",
    status: "In Review",
    score: 72,
    date: new Date("2025-07-12"),
    faculty: "Faculty of Business & Management",
    department: "Department of Business Administration",
    program: "MBA Executive",
  },
  {
    id: 3,
    sapId: "2025-003",
    name: "Sara Malik",
    email: "sara.malik@student.uol.edu.pk",
    status: "Completed",
    score: 91,
    date: new Date("2025-07-08"),
    faculty: "Faculty of Computing & Technology",
    department: "Department of Computer Science",
    program: "PhD Computer Science",
  },
  {
    id: 4,
    sapId: "2025-004",
    name: "Usman Tariq",
    email: "usman.tariq@student.uol.edu.pk",
    status: "Pending",
    score: null,
    date: new Date("2025-07-14"),
    faculty: "Faculty of Engineering",
    department: "Department of Engineering",
    program: "MSc Engineering",
  },
  {
    id: 5,
    sapId: "2025-005",
    name: "Nadia Hussain",
    email: "nadia.hussain@student.uol.edu.pk",
    status: "In Review",
    score: 65,
    date: new Date("2025-07-13"),
    faculty: "Faculty of Social Sciences & Humanities",
    department: "Department of Education",
    program: "MA Education",
  },
  {
    id: 6,
    sapId: "2025-006",
    name: "Kamran Shah",
    email: "kamran.shah@student.uol.edu.pk",
    status: "Rejected",
    score: 42,
    date: new Date("2025-07-06"),
    faculty: "Faculty of Health Sciences",
    department: "Department of Pharmacy",
    program: "BSc Pharmacy",
  },
  {
    id: 7,
    sapId: "2025-007",
    name: "Fatima Zahra",
    email: "fatima.zahra@student.uol.edu.pk",
    status: "Completed",
    score: 79,
    date: new Date("2025-07-05"),
    faculty: "Faculty of Social Sciences & Humanities",
    department: "Department of Sociology",
    program: "MPhil Sociology",
  },
  {
    id: 8,
    sapId: "2025-008",
    name: "Hamza Qureshi",
    email: "hamza.qureshi@student.uol.edu.pk",
    status: "Pending",
    score: null,
    date: new Date("2025-07-15"),
    faculty: "Faculty of Health Sciences",
    department: "Department of Biotechnology",
    program: "MSc Biotechnology",
  },
]

/* ------------------------------------------------------------------ */
/*  Status config                                                     */
/* ------------------------------------------------------------------ */

const statusConfig: Record<Status, {
  label: string
  icon: React.ElementType
  classes: string
  dot: string
}> = {
  Completed: {
    label: "Completed",
    icon: CheckCircle2,
    classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  "In Review": {
    label: "In Review",
    icon: Clock,
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  Pending: {
    label: "Pending",
    icon: AlertCircle,
    classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
  },
  Rejected: {
    label: "Rejected",
    icon: AlertCircle,
    classes: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    dot: "bg-red-500",
  },
}

/* ------------------------------------------------------------------ */
/*  Sort header button                                                */
/* ------------------------------------------------------------------ */

function SortTh({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = current === sortKey
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-widest select-none cursor-pointer",
        "text-muted-foreground hover:text-foreground transition-colors",
        active && "text-foreground",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          : <ChevronsUpDown size={11} className="opacity-40" />
        }
      </span>
    </th>
  )
}

/* ------------------------------------------------------------------ */
/*  Action cell                                                       */
/* ------------------------------------------------------------------ */

const actionMenu = [
  { label: "View", icon: Eye, classes: "text-foreground hover:text-foreground" },
  { label: "Approve", icon: CheckCircle2, classes: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-600" },
  { label: "Return", icon: Undo2, classes: "text-amber-600 dark:text-amber-400 hover:text-amber-600", divider: true },
]

function ActionCell() {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center justify-end">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border border-border/60 text-muted-foreground",
          "hover:bg-muted hover:text-foreground transition-colors duration-150",
          open && "bg-muted text-foreground"
        )}
        aria-label="Actions"
      >
        Actions
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute right-0 top-full mt-1.5 z-50 w-44",
              "rounded-lg border border-border bg-popover shadow-md py-1",
            )}
          >
            {actionMenu.map((action) => {
              const ActionIcon = action.icon
              return (
                <React.Fragment key={action.label}>
                  {action.divider && <div className="my-1 h-px bg-border/60 mx-2" />}
                  <button
                    onClick={() => setOpen(false)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium transition-colors duration-100",
                      "hover:bg-muted/60",
                      action.classes
                    )}
                  >
                    <ActionIcon size={13} strokeWidth={1.8} />
                    {action.label}
                  </button>
                </React.Fragment>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Filter dropdown                                                   */
/* ------------------------------------------------------------------ */

interface FilterOption {
  value: string
  label: string
  icon?: React.ElementType
  count?: number
  classes?: string
}

function FilterDropdown({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string
  icon: React.ElementType
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-lg border border-border bg-background text-xs font-medium",
          "hover:bg-muted/50 transition-colors duration-150",
          open && "bg-muted/50"
        )}
      >
        <Icon size={13} className="text-muted-foreground" strokeWidth={1.8} />
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-foreground truncate max-w-[9rem]">{selected?.label ?? value}</span>
        <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute left-0 top-full mt-1.5 z-50 w-60",
              "rounded-lg border border-border bg-popover shadow-md py-1"
            )}
          >
            {options.map(option => {
              const OptionIcon = option.icon
              const active = option.value === value
              return (
                <button
                  key={option.value}
                  onClick={() => { onChange(option.value); setOpen(false) }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium transition-colors duration-100",
                    "hover:bg-muted/60",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {OptionIcon && (
                    <OptionIcon
                      size={13}
                      strokeWidth={1.8}
                      className={cn("shrink-0", option.classes || "text-muted-foreground")}
                    />
                  )}
                  <span className="flex-1 text-left truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-[0.625rem] tabular-nums opacity-60">{option.count}</span>
                  )}
                  {active && <Check size={13} className="text-foreground shrink-0" strokeWidth={2.2} />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

interface AppraisalListProps {
  loading?: boolean
}

export function AppraisalList({ loading = false }: AppraisalListProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<Status | "All">("All")
  const [facultyFilter, setFacultyFilter] = React.useState("All")
  const [departmentFilter, setDepartmentFilter] = React.useState("All")
  const [programFilter, setProgramFilter] = React.useState("All")
  const [sortKey, setSortKey] = React.useState<SortKey>("date")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const filtered = React.useMemo(() => {
    return appraisals
      .filter(a => {
        const matchSearch =
          a.sapId.toLowerCase().includes(search.toLowerCase()) ||
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()) ||
          a.faculty.toLowerCase().includes(search.toLowerCase()) ||
          a.department.toLowerCase().includes(search.toLowerCase()) ||
          a.program.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === "All" || a.status === statusFilter
        const matchFaculty = facultyFilter === "All" || a.faculty === facultyFilter
        const matchDepartment = departmentFilter === "All" || a.department === departmentFilter
        const matchProgram = programFilter === "All" || a.program === programFilter
        return matchSearch && matchStatus && matchFaculty && matchDepartment && matchProgram
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortKey === "sapId") cmp = a.sapId.localeCompare(b.sapId)
        else if (sortKey === "name") cmp = a.name.localeCompare(b.name)
        else if (sortKey === "email") cmp = a.email.localeCompare(b.email)
        else if (sortKey === "status") cmp = a.status.localeCompare(b.status)
        else if (sortKey === "score") cmp = (a.score ?? -1) - (b.score ?? -1)
        else if (sortKey === "date") cmp = a.date.getTime() - b.date.getTime()
        else if (sortKey === "faculty") cmp = a.faculty.localeCompare(b.faculty)
        else if (sortKey === "department") cmp = a.department.localeCompare(b.department)
        else if (sortKey === "program") cmp = a.program.localeCompare(b.program)
        return sortDir === "asc" ? cmp : -cmp
      })
  }, [search, statusFilter, facultyFilter, departmentFilter, programFilter, sortKey, sortDir])

  const statusOptions = React.useMemo(() => {
    const counts: Record<string, number> = { All: appraisals.length }
    appraisals.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1 })
    return ([
      { value: "All", label: "All statuses", icon: ListFilter, count: counts.All },
      { value: "Completed", label: "Completed", icon: CheckCircle2, count: counts.Completed, classes: "text-emerald-600" },
      { value: "In Review", label: "In Review", icon: Clock, count: counts["In Review"], classes: "text-amber-600" },
      { value: "Pending", label: "Pending", icon: AlertCircle, count: counts.Pending, classes: "text-blue-600" },
      { value: "Rejected", label: "Rejected", icon: AlertCircle, count: counts.Rejected, classes: "text-red-600" },
    ] as FilterOption[])
  }, [])

  const makeOptions = (key: "faculty" | "department" | "program", allLabel: string, icon: React.ElementType) => {
    const counts: Record<string, number> = {}
    appraisals.forEach(a => { counts[a[key]] = (counts[a[key]] ?? 0) + 1 })
    return [
      { value: "All", label: allLabel, icon, count: appraisals.length },
      ...Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([value, count]) => ({
        value, label: value, icon, count
      }))
    ] as FilterOption[]
  }

  const facultyOptions = React.useMemo(() => makeOptions("faculty", "All faculties", Building2), [])
  const departmentOptions = React.useMemo(() => makeOptions("department", "All departments", Layers), [])
  const programOptions = React.useMemo(() => makeOptions("program", "All programs", BookMarked), [])

  const activeFilters = [statusFilter, facultyFilter, departmentFilter, programFilter].filter(v => v !== "All").length

  return (
    <div className="flex flex-col gap-5">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search applicants, SAP IDs, emails…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(
              "w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/60",
              "transition-all duration-150"
            )}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Status"
            icon={ListFilter}
            value={statusFilter}
            options={statusOptions}
            onChange={v => setStatusFilter(v as Status | "All")}
          />
          <FilterDropdown
            label="Faculty"
            icon={Building2}
            value={facultyFilter}
            options={facultyOptions}
            onChange={setFacultyFilter}
          />
          <FilterDropdown
            label="Department"
            icon={Layers}
            value={departmentFilter}
            options={departmentOptions}
            onChange={setDepartmentFilter}
          />
          <FilterDropdown
            label="Program"
            icon={BookMarked}
            value={programFilter}
            options={programOptions}
            onChange={setProgramFilter}
          />
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setStatusFilter("All")
                setFacultyFilter("All")
                setDepartmentFilter("All")
                setProgramFilter("All")
              }}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border text-xs font-medium",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
              )}
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* Table header meta */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading…" : <><span className="font-semibold text-foreground">{filtered.length}</span> appraisal{filtered.length !== 1 ? "s" : ""}</>}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter size={11} />
            {activeFilters > 0 ? `${activeFilters} filter${activeFilters !== 1 ? "s" : ""} active` : "All filters"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/10">
                <SortTh label="SAP ID" sortKey="sapId" current={sortKey} dir={sortDir} onSort={handleSort} className="pl-5" />
                <SortTh label="Name" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Email" sortKey="email" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Score" sortKey="score" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Submission" sortKey="date" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Faculty" sortKey="faculty" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Department" sortKey="department" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Program" sortKey="program" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-5 py-4"><Skeleton className="h-3 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-3 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-3 w-40" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-3 w-12" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-3 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-3 w-44" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-3 w-44" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-3 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-20 rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <FileText size={32} className="mx-auto mb-3 text-muted-foreground/40" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-foreground">No appraisals found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter.</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((item, i) => {
                    const cfg = statusConfig[item.status]
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03, ease: [0.4, 0, 0.2, 1] }}
                        className={cn(
                          "group border-b border-border/40 last:border-0",
                          "hover:bg-muted/30 transition-colors duration-150"
                        )}
                      >
                        {/* SAP ID */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-foreground tabular-nums">{item.sapId}</span>
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">{item.name}</p>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-muted-foreground truncate">{item.email}</p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold border",
                            cfg.classes
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3.5">
                          {item.score !== null ? (
                            <span className="text-sm font-bold tabular-nums">
                              {item.score} <span className="text-muted-foreground w-20 font-medium">({item.score}%)</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </td>

                        {/* Date of Submission */}
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium text-foreground">{format(item.date, "dd MMM yyyy")}</p>
                        </td>

                        {/* Faculty */}
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-foreground">{item.faculty}</p>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-foreground">{item.department}</p>
                        </td>

                        {/* Program */}
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-foreground">{item.program}</p>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <ActionCell />
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
              <span className="font-medium text-foreground">{appraisals.length}</span> appraisals
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
