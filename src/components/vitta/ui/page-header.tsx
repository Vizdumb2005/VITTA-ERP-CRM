"use client";

import { Search, RotateCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Standard module header: title + record count, optional search box,
 * refresh + custom action buttons (usually "New").
 */
export function PageHeader({
  title,
  itemCount,
  search,
  onSearch,
  searchPlaceholder = "Search...",
  onRefresh,
  loading,
  actions,
  children,
  className,
}: {
  title: string;
  itemCount?: number;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
  /** below-header strip (stats, tabs, filters) */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b bg-white px-4 pt-4 md:px-6", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto flex items-baseline gap-2">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {itemCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? "record" : "records"}
            </span>
          )}
        </div>
        {onSearch ? (
          <div className="relative order-3 w-full sm:order-none sm:w-56 md:w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search ?? ""}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 bg-muted/40 pl-8"
              aria-label={`Search ${title}`}
            />
          </div>
        ) : null}
        {onRefresh ? (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={onRefresh}
            aria-label="Refresh"
            disabled={loading}
          >
            <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        ) : null}
        {actions}
      </div>
      {children ? <div className="pb-3 pt-3">{children}</div> : <div className="pb-3" />}
    </div>
  );
}
