"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** hide this column below sm breakpoint (mobile) */
  hideSm?: boolean;
  /** hide this column below md breakpoint */
  hideMd?: boolean;
}

export function DataTable<T extends { id: string }>({
  columns,
  items,
  onRowClick,
  loading,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyIcon,
  rowClassName,
}: {
  columns: Column<T>[];
  items: T[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  rowClassName?: (item: T) => string | undefined;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4 md:p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;
  }

  return (
    <div className="scroll-slim flex-1 overflow-auto px-2 pb-6 md:px-4">
      <div className="min-w-0 overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    c.hideSm && "hidden sm:table-cell",
                    c.hideMd && "hidden md:table-cell",
                    c.headerClassName
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter") onRowClick(item);
                      }
                    : undefined
                }
                className={cn(
                  "border-b last:border-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-[#F3EDF2]/50",
                  rowClassName?.(item)
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-2.5 align-middle",
                      c.hideSm && "hidden sm:table-cell",
                      c.hideMd && "hidden md:table-cell",
                      c.className
                    )}
                  >
                    {c.render ? c.render(item) : String((item as Record<string, unknown>)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
