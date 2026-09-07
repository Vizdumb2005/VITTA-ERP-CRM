"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Award, CalendarDays, Clock, ListChecks, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { fmtDate, initials, toDateInput } from "@/lib/vitta/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Employee, Project, Timesheet } from "@/lib/vitta/types";

/** Radix Select forbids empty-string item values, so optional choices use a sentinel. */
const NONE = "__none__";
const WEEKLY_TARGET = 40;

function fmtHours(n: number): string {
  return `${Math.round(n * 10) / 10}h`;
}

export default function TimesheetsModule() {
  const { items, loading, reload, create, update, remove } = useResource<Timesheet>("timesheets");
  const { items: employees } = useResource<Employee>("employees");
  const { items: projects } = useResource<Project>("projects");

  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Timesheet | null }>({ open: false, item: null });

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 6);
    return d;
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (t) =>
        (t.employeeName ?? "").toLowerCase().includes(needle) ||
        (t.projectName ?? "").toLowerCase().includes(needle) ||
        (t.description ?? "").toLowerCase().includes(needle)
    );
  }, [items, q]);

  const stats = useMemo(() => {
    const last7 = items.filter((t) => new Date(t.date) >= cutoff);
    const hours7 = last7.reduce((a, t) => a + t.hours, 0);
    const perEmployee = new Map<string, number>();
    for (const t of last7) {
      const name = t.employeeName ?? "Unknown";
      perEmployee.set(name, (perEmployee.get(name) ?? 0) + t.hours);
    }
    const bars = [...perEmployee.entries()]
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours);
    return {
      hours7,
      entries7: last7.length,
      topName: bars[0]?.name ?? "—",
      topHours: bars[0]?.hours ?? 0,
      avgPerDay: hours7 / 7,
      bars,
    };
  }, [items, cutoff]);

  const employeeOptions = useMemo(() => employees.map((e) => ({ value: e.id, label: e.name })), [employees]);
  const projectOptions = useMemo(
    () => [{ value: NONE, label: "— Internal —" }, ...projects.map((p) => ({ value: p.id, label: p.name }))],
    [projects]
  );

  const FIELDS: FieldDef[] = useMemo(
    () => [
      { name: "employeeId", label: "Employee", type: "select", required: true, options: employeeOptions, placeholder: "Select employee..." },
      { name: "projectId", label: "Project", type: "select", options: projectOptions, defaultValue: NONE },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "hours", label: "Hours", type: "number", required: true, step: "0.5", placeholder: "e.g. 4.5" },
      { name: "description", label: "Description", type: "textarea", full: true, placeholder: "What did you work on?" },
    ],
    [employeeOptions, projectOptions]
  );

  async function handleSave(values: RecordValues) {
    const payload = {
      employeeId: values.employeeId,
      projectId: values.projectId && values.projectId !== NONE ? values.projectId : null,
      date: values.date,
      hours: Number(values.hours || 0),
      description: values.description || null,
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Timesheet entry updated");
    } else {
      await create(payload);
      toast.success("Hours logged");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("Timesheet entry deleted");
    setDrawer({ open: false, item: null });
  }

  const columns: Column<Timesheet>[] = [
    {
      key: "employeeName",
      header: "Employee",
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7 border">
            <AvatarFallback className="bg-[#F3EDF2] text-[10px] font-bold text-[#714B67]">
              {initials(t.employeeName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-medium">{t.employeeName ?? "Unknown"}</span>
        </div>
      ),
    },
    { key: "projectName", header: "Project", hideSm: true, render: (t) => t.projectName ?? "Internal" },
    { key: "date", header: "Date", render: (t) => fmtDate(t.date) },
    { key: "hours", header: "Hours", render: (t) => <span className="font-medium">{fmtHours(t.hours)}</span> },
    {
      key: "description",
      header: "Description",
      hideMd: true,
      render: (t) => (
        <span className="block max-w-xs truncate text-muted-foreground">{t.description ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Timesheets"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search entries..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard label="Hours logged (7 days)" value={fmtHours(stats.hours7)} icon={<Clock className="h-5 w-5" />} tone="brand" />
        <StatCard label="Entries (7 days)" value={stats.entries7} sub={`${items.length} total`} icon={<ListChecks className="h-5 w-5" />} tone="sky" />
        <StatCard label="Top logger this week" value={stats.topName} sub={fmtHours(stats.topHours)} icon={<Award className="h-5 w-5" />} tone="violet" />
        <StatCard label="Avg hours/day (7 days)" value={stats.avgPerDay.toFixed(1)} icon={<CalendarDays className="h-5 w-5" />} tone="emerald" />
      </div>

      <div className="px-4 pt-4 md:px-6">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">This week — hours per employee</h2>
          <div className="mt-3 space-y-2.5">
            {stats.bars.map((b) => {
              const pct = Math.min(100, Math.round((b.hours / WEEKLY_TARGET) * 100));
              const over = b.hours > WEEKLY_TARGET;
              return (
                <div key={b.name} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 truncate text-xs font-medium text-foreground sm:w-40">{b.name}</div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", over ? "bg-amber-500" : "bg-[#714B67]")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-12 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                    {fmtHours(b.hours)}
                  </div>
                </div>
              );
            })}
            {stats.bars.length === 0 && (
              <div className="py-2 text-xs text-muted-foreground">No hours logged in the last 7 days.</div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(t) => setDrawer({ open: true, item: t })}
          loading={loading}
          emptyIcon={<Search className="h-7 w-7" />}
          emptyTitle="No timesheet entries found"
          emptyDescription="Log your first hours to track where time is spent."
        />
      </div>

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? "Edit Timesheet Entry" : "New Timesheet Entry"}
        description="Track hours worked per employee and project."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item, date: toDateInput(drawer.item.date), projectId: drawer.item.projectId ?? NONE } : null}
        onSubmit={handleSave}
        onDelete={drawer.item ? handleDelete : undefined}
      />
    </div>
  );
}
