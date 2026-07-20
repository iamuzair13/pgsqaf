import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type TableOptions,
} from "@tanstack/react-table";

export type { ColumnDef };

export function createTableConfig<TData>(
  options: Omit<TableOptions<TData>, "getCoreRowModel">
) {
  return {
    ...options,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  };
}

export { useReactTable };
