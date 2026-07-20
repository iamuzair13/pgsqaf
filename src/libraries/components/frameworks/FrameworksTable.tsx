"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type Column,
} from "@tanstack/react-table";
import type { Framework } from "@/types";
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Eye, Pencil, Trash2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FrameworkStatusBadge } from "./FrameworkStatusBadge";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Framework>();

interface FrameworksTableProps {
  loading?: boolean;
}

export function FrameworksTable({ loading: externalLoading = false }: FrameworksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [data, setData] = useState<Framework[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setFetching(true);
    fetch("/api/frameworks")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load frameworks");
        return res.json();
      })
      .then((rows: Framework[]) => setData(rows))
      .catch(err => setFetchError(err.message))
      .finally(() => setFetching(false));
  }, []);

  const handleDelete = useCallback(async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setData(prev => prev.filter(f => f.id !== id));
    try {
      const res = await fetch(`/api/frameworks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(`"${title}" deleted`);
    } catch {
      toast.error("Failed to delete framework. Please try again.");
      setFetching(true);
      fetch("/api/frameworks")
        .then(r => r.json())
        .then((rows: Framework[]) => setData(rows))
        .finally(() => setFetching(false));
    }
  }, []);

  const loading = externalLoading || fetching;

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: ({ column }) => <SortableHeader column={column as Column<Framework, unknown>} label="Title" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/frameworks/${row.original.id}`}
              className="text-sm font-medium text-foreground hover:text-primary hover:underline underline-offset-4 transition-colors"
            >
              {row.getValue("title")}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
              {row.original.description}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: () => <span className="text-xs font-medium text-muted-foreground">Status</span>,
        cell: ({ getValue }) => <FrameworkStatusBadge status={getValue()} />,
      }),
      columnHelper.accessor("version", {
        header: ({ column }) => <SortableHeader column={column as Column<Framework, unknown>} label="Version" />,
        cell: ({ getValue }) => (
          <span className="text-xs tabular-nums text-muted-foreground">v{getValue()}</span>
        ),
      }),
      columnHelper.accessor("criteria_count", {
        header: ({ column }) => <SortableHeader column={column as Column<Framework, unknown>} label="Criteria" />,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium tabular-nums text-foreground">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("created_by_name", {
        header: () => <span className="text-xs font-medium text-muted-foreground">Created By</span>,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: ({ column }) => <SortableHeader column={column as Column<Framework, unknown>} label="Date" />,
        cell: ({ getValue }) => {
          const v = getValue();
          return (
            <span className="text-sm text-muted-foreground">
              {v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RowActions
            id={row.original.id}
            title={row.original.title}
            onDelete={handleDelete}
          />
        ),
      }),
    ],
    [handleDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Input
          type="search"
          placeholder="Search frameworks..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          aria-label="Search frameworks"
          className="w-72"
        />
        <Button render={<Link href="/frameworks/new" />}>
          <Plus size={14} aria-hidden="true" />
          New Framework
        </Button>
      </div>

      {/* Table */}
      {table.getRowModel().rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/50 hover:bg-muted/50">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              of {table.getFilteredRowModel().rows.length} frameworks
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SortableHeader({ column, label }: { column: Column<Framework, unknown>; label: string }) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="-ml-2 h-7 gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      aria-label={`Sort by ${label}`}
    >
      {label}
      {sorted === "asc" ? <ArrowUp size={11} aria-hidden="true" /> : sorted === "desc" ? <ArrowDown size={11} aria-hidden="true" /> : <ArrowUpDown size={10} aria-hidden="true" />}
    </Button>
  );
}

function RowActions({ id, title, onDelete }: {
  id: number;
  title: string;
  onDelete: (id: number, title: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
        aria-label="Row actions"
      >
        <MoreHorizontal size={15} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem className="gap-2 cursor-pointer text-small" render={<Link href={`/frameworks/${id}`} />}>
          <Eye size={13} aria-hidden="true" /> View
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer text-small" render={<Link href={`/frameworks/${id}/edit`} />}>
          <Pencil size={13} aria-hidden="true" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="gap-2 cursor-pointer text-small"
          onClick={() => onDelete(id, title)}
        >
          <Trash2 size={13} aria-hidden="true" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-base font-medium text-foreground mb-2">No frameworks yet</p>
      <p className="text-sm text-muted-foreground mb-6">Create your first quality appraisal framework to get started.</p>
      <Button render={<Link href="/frameworks/new" />}>
        <Plus size={14} aria-hidden="true" />
        New Framework
      </Button>
    </div>
  );
}
