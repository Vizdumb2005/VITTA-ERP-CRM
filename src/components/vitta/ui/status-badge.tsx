"use client";

import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/vitta/types";

export function StatusBadge({
  status,
  map,
  className,
}: {
  /** raw status value (e.g. "won", "rfq", "posted") */
  status?: string | null;
  /** optional module-local overrides: value → { label, className } */
  map?: Record<string, { label: string; className: string }>;
  className?: string;
}) {
  if (!status) return null;
  const style = map?.[status] ?? STATUS_STYLES[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-stone-100 text-stone-700 border-stone-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
}
