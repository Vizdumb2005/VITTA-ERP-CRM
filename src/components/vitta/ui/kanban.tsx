"use client";

import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface KanbanStage {
  key: string;
  label: string;
  /** tailwind bg color class for the stage dot, e.g. "bg-sky-500" */
  dot?: string;
}

export function Kanban<T extends { id: string }>({
  stages,
  items,
  getStage,
  renderCard,
  onStageChange,
  stageOptions,
  loading,
  cardClassName,
}: {
  stages: KanbanStage[];
  items: T[];
  getStage: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  /** enables the stage dropdown on each card */
  onStageChange?: (item: T, newStage: string) => void;
  /** which stage values to offer in the dropdown (defaults to all stages) */
  stageOptions?: string[];
  loading?: boolean;
  cardClassName?: string;
}) {
  const options = stageOptions ?? stages.map((s) => s.key);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden p-4 md:p-6">
        {stages.slice(0, 4).map((s) => (
          <div key={s.key} className="w-[270px] shrink-0 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="scroll-slim flex flex-1 gap-4 overflow-x-auto p-4 md:p-6">
      {stages.map((stage) => {
        const columnItems = items.filter((i) => getStage(i) === stage.key);
        return (
          <section
            key={stage.key}
            aria-label={stage.label}
            className="flex w-[270px] shrink-0 flex-col rounded-xl bg-muted/40 sm:w-[290px]"
          >
            <header className="flex items-center gap-2 px-3 pb-2 pt-3">
              <span className={cn("h-2.5 w-2.5 rounded-full", stage.dot ?? "bg-stone-400")} />
              <h2 className="text-sm font-semibold text-foreground">{stage.label}</h2>
              <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {columnItems.length}
              </span>
            </header>
            <div className="scroll-slim flex-1 space-y-3 overflow-y-auto px-3 pb-4" style={{ maxHeight: "calc(100vh - 260px)" }}>
              {columnItems.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    "group relative rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
                    cardClassName
                  )}
                >
                  {renderCard(item)}
                  {onStageChange ? (
                    <div className="mt-2 flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                            aria-label="Move to stage"
                          >
                            Set stage <ChevronDown className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {options.map((opt) => {
                            const st = stages.find((s) => s.key === opt);
                            return (
                              <DropdownMenuItem key={opt} onClick={() => onStageChange(item, opt)}>
                                <span className={cn("mr-2 h-2 w-2 rounded-full", st?.dot ?? "bg-stone-400")} />
                                {st?.label ?? opt}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : null}
                </article>
              ))}
              {columnItems.length === 0 && (
                <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
