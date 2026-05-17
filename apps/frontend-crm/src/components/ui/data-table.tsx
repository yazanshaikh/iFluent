import { useState } from 'react';
import {
  type ColumnDef,
  type Column,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Sortable column header ── */
export function SortableHeader<TData, TValue>({
  column,
  label,
}: {
  column: Column<TData, TValue>;
  label:  string;
}) {
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="flex items-center gap-1 hover:text-foreground transition-colors group"
    >
      {label}
      {column.getIsSorted() === 'asc'  ? <ArrowUp   className="h-3.5 w-3.5 text-primary" /> :
       column.getIsSorted() === 'desc' ? <ArrowDown  className="h-3.5 w-3.5 text-primary" /> :
                                         <ArrowUpDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-60" />}
    </button>
  );
}

/* ── Generic DataTable ── */
interface DataTableProps<TData> {
  columns:     ColumnDef<TData, unknown>[];
  data:        TData[];
  isLoading?:  boolean;
  isError?:    boolean;
  onRowClick?: (row: TData) => void;
  emptyState?: React.ReactNode;
}

export function DataTable<TData,>({
  columns,
  data,
  isLoading  = false,
  isError    = false,
  onRowClick,
  emptyState,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state:              { sorting },
    onSortingChange:    setSorting,
    getCoreRowModel:    getCoreRowModel(),
    getSortedRowModel:  getSortedRowModel(),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin ml-2" />
      جارٍ التحميل...
    </div>
  );

  if (isError) return (
    <p className="text-center py-16 text-destructive text-sm">
      حدث خطأ أثناء جلب البيانات
    </p>
  );

  if (!data.length) return (
    <>{emptyState ?? <p className="text-center py-16 text-muted-foreground text-sm">لا توجد بيانات</p>}</>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b">
              {hg.headers.map((h) => (
                <th key={h.id} className="text-right pb-3 pr-4 font-medium text-muted-foreground whitespace-nowrap">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={cn(
                'border-b last:border-0 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-muted/40',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-3 pr-4 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
