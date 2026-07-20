"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Building2,
  FolderTree,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import type { Faculty, Department, Program } from "@/types"

/* ------------------------------------------------------------------ */
/*  API helpers                                                       */
/* ------------------------------------------------------------------ */

const api = {
  faculties: {
    list: () => fetch("/api/faculties", { cache: "no-store" }).then((r) => r.json()) as Promise<Faculty[]>,
    create: (d: Record<string, unknown>) =>
      fetch("/api/faculties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    update: (id: number, d: Record<string, unknown>) =>
      fetch(`/api/faculties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    remove: (id: number) =>
      fetch(`/api/faculties/${id}`, { method: "DELETE" }).then((r) => r.json()),
  },
  departments: {
    list: (facultyId?: number) =>
      fetch(`/api/departments${facultyId ? `?faculty_id=${facultyId}` : ""}`, { cache: "no-store" }).then((r) => r.json()) as Promise<Department[]>,
    create: (d: Record<string, unknown>) =>
      fetch("/api/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    update: (id: number, d: Record<string, unknown>) =>
      fetch(`/api/departments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    remove: (id: number) =>
      fetch(`/api/departments/${id}`, { method: "DELETE" }).then((r) => r.json()),
  },
  programs: {
    list: (deptId?: number) =>
      fetch(`/api/programs${deptId ? `?department_id=${deptId}` : ""}`, { cache: "no-store" }).then((r) => r.json()) as Promise<Program[]>,
    create: (d: Record<string, unknown>) =>
      fetch("/api/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    update: (id: number, d: Record<string, unknown>) =>
      fetch(`/api/programs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    remove: (id: number) =>
      fetch(`/api/programs/${id}`, { method: "DELETE" }).then((r) => r.json()),
  },
}

/* ------------------------------------------------------------------ */
/*  Generic entity dialog                                             */
/* ------------------------------------------------------------------ */

type EntityType = "faculty" | "department" | "program"

interface EntityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: EntityType
  entity: Faculty | Department | Program | null
  faculties: Faculty[]
  departments: Department[]
  onSaved: () => void
}

function EntityDialog({
  open,
  onOpenChange,
  type,
  entity,
  faculties,
  departments,
  onSaved,
}: EntityDialogProps) {
  const isEdit = !!entity
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // form fields
  const [name, setName] = React.useState("")
  const [code, setCode] = React.useState("")
  const [dean, setDean] = React.useState("")
  const [head, setHead] = React.useState("")
  const [level, setLevel] = React.useState("MPhil")
  const [duration, setDuration] = React.useState("2.0")
  const [description, setDescription] = React.useState("")
  const [facultyId, setFacultyId] = React.useState<number | null>(null)
  const [departmentId, setDepartmentId] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!open) return
    setError(null)
    setName("")
    setCode("")
    setDean("")
    setHead("")
    setLevel("MPhil")
    setDuration("2.0")
    setDescription("")
    setFacultyId(null)
    setDepartmentId(null)

    if (entity) {
      setName(entity.name || "")
      setCode(entity.code || "")
      setDescription(entity.description || "")
      if (type === "faculty") {
        setDean((entity as Faculty).dean || "")
      } else if (type === "department") {
        setHead((entity as Department).head || "")
        setFacultyId((entity as Department).faculty_id)
      } else if (type === "program") {
        setLevel((entity as Program).level || "MPhil")
        setDuration(String((entity as Program).duration_years || 2.0))
        setDepartmentId((entity as Program).department_id)
      }
    }
  }, [open, entity, type])

  const titles: Record<EntityType, { title: string; desc: string }> = {
    faculty: { title: isEdit ? "Edit Faculty" : "Add Faculty", desc: "Create a top-level academic faculty" },
    department: { title: isEdit ? "Edit Department" : "Add Department", desc: "Create a department under a faculty" },
    program: { title: isEdit ? "Edit Program" : "Add Program", desc: "Create a postgraduate program under a department" },
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (type === "faculty") {
        const payload: Record<string, unknown> = { name, code, dean, description }
        if (isEdit) await api.faculties.update((entity as Faculty).id, payload)
        else await api.faculties.create(payload)
      } else if (type === "department") {
        if (!facultyId) throw new Error("Please select a faculty")
        const payload: Record<string, unknown> = { faculty_id: facultyId, name, code, head, description }
        if (isEdit) await api.departments.update((entity as Department).id, payload)
        else await api.departments.create(payload)
      } else if (type === "program") {
        if (!departmentId) throw new Error("Please select a department")
        const payload: Record<string, unknown> = {
          department_id: departmentId,
          name, code, level,
          duration_years: parseFloat(duration) || 2.0,
          description,
        }
        if (isEdit) await api.programs.update((entity as Program).id, payload)
        else await api.programs.create(payload)
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[type].title}</DialogTitle>
          <DialogDescription>{titles[type].desc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parent selectors */}
          {type === "department" && (
            <div className="space-y-1.5">
              <Label>Faculty</Label>
              <Select value={facultyId ? String(facultyId) : undefined} onValueChange={(v) => setFacultyId(v ? Number(v) : null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "program" && (
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={departmentId ? String(departmentId) : undefined} onValueChange={(v) => setDepartmentId(v ? Number(v) : null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="entity-name">Name</Label>
            <Input id="entity-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Faculty of Engineering" required autoFocus />
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="entity-code">Code</Label>
            <Input id="entity-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FOE" required className="uppercase" />
          </div>

          {/* Faculty-specific */}
          {type === "faculty" && (
            <div className="space-y-1.5">
              <Label htmlFor="entity-dean">Dean (optional)</Label>
              <Input id="entity-dean" value={dean} onChange={(e) => setDean(e.target.value)} placeholder="Dr. John Doe" />
            </div>
          )}

          {/* Department-specific */}
          {type === "department" && (
            <div className="space-y-1.5">
              <Label htmlFor="entity-head">Department Head (optional)</Label>
              <Input id="entity-head" value={head} onChange={(e) => setHead(e.target.value)} placeholder="Dr. Jane Smith" />
            </div>
          )}

          {/* Program-specific */}
          {type === "program" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entity-level">Level</Label>
                <Select value={level} onValueChange={(v) => setLevel(v ?? "MPhil")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MPhil">MPhil</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MSc">MSc</SelectItem>
                    <SelectItem value="Postdoc">Postdoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entity-duration">Duration (years)</Label>
                <Input id="entity-duration" type="number" step="0.5" min="0.5" max="10" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            </div>
          )}

          {/* Description (all) */}
          <div className="space-y-1.5">
            <Label htmlFor="entity-desc">Description (optional)</Label>
            <Input id="entity-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/*  Delete confirm dialog                                             */
/* ------------------------------------------------------------------ */

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: EntityType
  entity: Faculty | Department | Program | null
  onDeleted: () => void
}

function DeleteEntityDialog({ open, onOpenChange, type, entity, onDeleted }: DeleteDialogProps) {
  const [deleting, setDeleting] = React.useState(false)

  async function handleDelete() {
    if (!entity) return
    setDeleting(true)
    try {
      if (type === "faculty") await api.faculties.remove((entity as Faculty).id)
      else if (type === "department") await api.departments.remove((entity as Department).id)
      else await api.programs.remove((entity as Program).id)
      onDeleted()
      onOpenChange(false)
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  const labels: Record<EntityType, string> = {
    faculty: "Faculty",
    department: "Department",
    program: "Program",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {labels[type]}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{entity?.name}</strong>?
            {type !== "program" && " This will also delete all child items."}
            {" "}This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 size={14} className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/*  Tree row component                                                */
/* ------------------------------------------------------------------ */

interface TreeRowProps {
  faculty: Faculty
  departments: Department[]
  programs: Program[]
  onEdit: (type: EntityType, entity: Faculty | Department | Program) => void
  onDelete: (type: EntityType, entity: Faculty | Department | Program) => void
  onAddDepartment: (facultyId: number) => void
  onAddProgram: (departmentId: number) => void
}

function TreeRow({
  faculty,
  departments,
  programs,
  onEdit,
  onDelete,
  onAddDepartment,
  onAddProgram,
}: TreeRowProps) {
  const [expanded, setExpanded] = React.useState(true)
  const facultyDepts = departments.filter((d) => d.faculty_id === faculty.id)

  return (
    <div className="space-y-1">
      {/* Faculty row */}
      <div className="flex items-center gap-2 group rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{faculty.name}</span>
            <Badge variant="outline" className="text-[0.625rem] px-1.5 py-0">{faculty.code}</Badge>
            {!faculty.status && <Badge variant="destructive" className="text-[0.625rem] px-1.5 py-0">Inactive</Badge>}
          </div>
          {faculty.dean && (
            <p className="text-xs text-muted-foreground truncate">Dean: {faculty.dean}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          {facultyDepts.length} dept{facultyDepts.length !== 1 ? "s" : ""}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
            <MoreHorizontal size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddDepartment(faculty.id)}>
              <Plus size={13} />
              Add Department
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit("faculty", faculty)}>
              <Pencil size={13} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete("faculty", faculty)}>
              <Trash2 size={13} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Departments under faculty */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-4 border-l border-border/40 pl-2 space-y-1"
          >
            {facultyDepts.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2 italic">No departments yet</p>
            ) : (
              facultyDepts.map((dept) => {
                const deptPrograms = programs.filter((p) => p.department_id === dept.id)
                return (
                  <DepartmentRow
                    key={dept.id}
                    department={dept}
                    programs={deptPrograms}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddProgram={onAddProgram}
                  />
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface DepartmentRowProps {
  department: Department
  programs: Program[]
  onEdit: (type: EntityType, entity: Faculty | Department | Program) => void
  onDelete: (type: EntityType, entity: Faculty | Department | Program) => void
  onAddProgram: (departmentId: number) => void
}

function DepartmentRow({ department, programs, onEdit, onDelete, onAddProgram }: DepartmentRowProps) {
  const [expanded, setExpanded] = React.useState(true)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 group rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
          <FolderTree size={12} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{department.name}</span>
            <Badge variant="outline" className="text-[0.625rem] px-1.5 py-0">{department.code}</Badge>
            {!department.status && <Badge variant="destructive" className="text-[0.625rem] px-1.5 py-0">Inactive</Badge>}
          </div>
          {department.head && (
            <p className="text-xs text-muted-foreground truncate">Head: {department.head}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          {programs.length} prog{programs.length !== 1 ? "s" : ""}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
            <MoreHorizontal size={13} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddProgram(department.id)}>
              <Plus size={13} />
              Add Program
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit("department", department)}>
              <Pencil size={13} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete("department", department)}>
              <Trash2 size={13} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-4 border-l border-border/40 pl-2 space-y-1"
          >
            {programs.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2 italic">No programs yet</p>
            ) : (
              programs.map((prog) => (
                <ProgramRow
                  key={prog.id}
                  program={prog}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProgramRow({
  program,
  onEdit,
  onDelete,
}: {
  program: Program
  onEdit: (type: EntityType, entity: Faculty | Department | Program) => void
  onDelete: (type: EntityType, entity: Faculty | Department | Program) => void
}) {
  return (
    <div className="flex items-center gap-2 group rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <div className="w-1.5 shrink-0" />
      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
        <GraduationCap size={12} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{program.name}</span>
          <Badge variant="outline" className="text-[0.625rem] px-1.5 py-0">{program.code}</Badge>
          <Badge variant="secondary" className="text-[0.625rem] px-1.5 py-0">{program.level}</Badge>
          {!program.status && <Badge variant="destructive" className="text-[0.625rem] px-1.5 py-0">Inactive</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {program.duration_years} year{program.duration_years !== 1 ? "s" : ""}
          {program.description && ` · ${program.description}`}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <MoreHorizontal size={12} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit("program", program)}>
            <Pencil size={13} />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDelete("program", program)}>
            <Trash2 size={13} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function OrganizationManagement() {
  const [faculties, setFaculties] = React.useState<Faculty[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  // dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogType, setDialogType] = React.useState<EntityType>("faculty")
  const [editingEntity, setEditingEntity] = React.useState<Faculty | Department | Program | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteType, setDeleteType] = React.useState<EntityType>("faculty")
  const [deletingEntity, setDeletingEntity] = React.useState<Faculty | Department | Program | null>(null)

  const loadAll = React.useCallback(async () => {
    try {
      const [f, d, p] = await Promise.all([
        api.faculties.list(),
        api.departments.list(),
        api.programs.list(),
      ])
      setFaculties(f)
      setDepartments(d)
      setPrograms(p)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadAll()
  }, [loadAll])

  function handleAddFaculty() {
    setDialogType("faculty")
    setEditingEntity(null)
    setDialogOpen(true)
  }

  function handleAddDepartment(_facultyId?: number) {
    setDialogType("department")
    setEditingEntity(null)
    setDialogOpen(true)
  }

  function handleAddProgram(_departmentId?: number) {
    setDialogType("program")
    setEditingEntity(null)
    setDialogOpen(true)
  }

  function handleEdit(type: EntityType, entity: Faculty | Department | Program) {
    setDialogType(type)
    setEditingEntity(entity)
    setDialogOpen(true)
  }

  function handleDelete(type: EntityType, entity: Faculty | Department | Program) {
    setDeleteType(type)
    setDeletingEntity(entity)
    setDeleteOpen(true)
  }

  const filteredFaculties = React.useMemo(() => {
    if (!search.trim()) return faculties
    const q = search.toLowerCase()
    return faculties.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        departments.some(
          (d) =>
            d.faculty_id === f.id &&
            (d.name.toLowerCase().includes(q) ||
              programs.some((p) => p.department_id === d.id && p.name.toLowerCase().includes(q)))
        )
    )
  }, [faculties, departments, programs, search])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organization..."
            className="pl-8"
          />
        </div>
        <Button onClick={handleAddFaculty} size="sm">
          <Plus size={14} />
          Add Faculty
        </Button>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5">
            <Building2 size={14} className="text-blue-500" />
            <span className="text-sm font-medium">{faculties.length}</span>
            <span className="text-xs text-muted-foreground">Faculties</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5">
            <FolderTree size={14} className="text-violet-500" />
            <span className="text-sm font-medium">{departments.length}</span>
            <span className="text-xs text-muted-foreground">Departments</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5">
            <GraduationCap size={14} className="text-emerald-500" />
            <span className="text-sm font-medium">{programs.length}</span>
            <span className="text-xs text-muted-foreground">Programs</span>
          </div>
        </div>
      )}

      {/* Tree view */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredFaculties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Building2 size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {search ? "No results found" : "No faculties yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Try a different search" : "Add your first faculty to start building the organization"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
          {filteredFaculties.map((faculty) => (
            <TreeRow
              key={faculty.id}
              faculty={faculty}
              departments={departments}
              programs={programs}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddDepartment={handleAddDepartment}
              onAddProgram={handleAddProgram}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <EntityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        entity={editingEntity}
        faculties={faculties}
        departments={departments}
        onSaved={loadAll}
      />
      <DeleteEntityDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type={deleteType}
        entity={deletingEntity}
        onDeleted={loadAll}
      />
    </div>
  )
}
