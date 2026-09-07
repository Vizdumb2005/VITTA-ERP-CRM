"use client";

import { useMemo } from "react";
import { CalendarDays, Users, CalendarCheck, Percent, UserCheck } from "lucide-react";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/vitta/format";
import type { Employee } from "@/lib/vitta/types";
import { cn } from "@/lib/utils";

interface ShiftType {
  key: string;
  label: string;
  time: string;
  chip: string;
}

const SHIFTS: ShiftType[] = [
  { key: "morning", label: "Morning", time: "9–13", chip: "bg-teal-100 text-teal-800" },
  { key: "afternoon", label: "Afternoon", time: "13–18", chip: "bg-orange-100 text-orange-800" },
  { key: "full", label: "Full day", time: "9–18", chip: "bg-[#F3EDF2] text-[#714B67]" },
  { key: "field", label: "Field", time: "10–16", chip: "bg-sky-100 text-sky-800" },
  { key: "off", label: "Off", time: "", chip: "bg-stone-50 text-stone-400" },
];

function charCodeSum(s: string): number {
  return s.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
}

function shiftFor(employeeId: string, dayIndex: number): ShiftType {
  return SHIFTS[(charCodeSum(employeeId) + dayIndex) % SHIFTS.length];
}

export default function PlanningModule() {
  const { items: employees, loading, reload } = useResource<Employee>("employees");

  const week = useMemo(() => {
    const now = new Date();
    const dow = now.getDay(); // 0 = Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const rows = useMemo(() => employees.filter((e) => e.status !== "departed"), [employees]);
  const todayIndex = week.findIndex((d) => d.toDateString() === new Date().toDateString());
  const activeCount = employees.filter((e) => e.status === "active").length;

  const scheduledShifts = useMemo(
    () =>
      rows.reduce(
        (a, emp) => a + SHIFTS.filter((_, dayIdx) => shiftFor(emp.id, dayIdx).key !== "off").length,
        0
      ),
    [rows]
  );
  const totalSlots = rows.length * 7;
  const coverage = totalSlots ? Math.round((scheduledShifts / totalSlots) * 100) : 0;
  const todayOnShift = todayIndex >= 0 ? rows.filter((emp) => shiftFor(emp.id, todayIndex).key !== "off").length : 0;

  const weekLabel = week[0].toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Planning"
        itemCount={rows.length}
        onRefresh={reload}
        loading={loading}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Week of {weekLabel} — auto-generated demo schedule (read-only)
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard label="Active employees" value={activeCount} sub={`${rows.length} scheduled`} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Scheduled shifts" value={scheduledShifts} sub={`of ${totalSlots} slots`} icon={<CalendarCheck className="h-5 w-5" />} tone="teal" />
        <StatCard label="Coverage" value={`${coverage}%`} icon={<Percent className="h-5 w-5" />} tone="sky" />
        <StatCard label="On shift today" value={todayOnShift} icon={<UserCheck className="h-5 w-5" />} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 md:px-6">
        {SHIFTS.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-full border border-black/5", s.chip)} />
            {s.label}
            {s.time ? <span className="text-[10px]">({s.time})</span> : null}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2 p-4 md:p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No employees to schedule"
          description="Add employees in the HR app to build a schedule."
        />
      ) : (
        <div className="scroll-slim flex-1 overflow-auto p-4 md:p-6">
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="sticky left-0 z-10 w-40 min-w-40 bg-muted/40 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Employee
                  </th>
                  {week.map((d, i) => (
                    <th
                      key={i}
                      className={cn(
                        "px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        i === todayIndex && "bg-[#F3EDF2]/70"
                      )}
                    >
                      <div>{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                      <div className="text-[11px] font-medium normal-case tracking-normal">
                        {d.getDate()}/{d.getMonth() + 1}
                        {i === todayIndex ? " · today" : ""}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((emp) => (
                  <tr key={emp.id} className="border-b last:border-0">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback className="bg-[#F3EDF2] text-[10px] font-bold text-[#714B67]">
                            {initials(emp.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{emp.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {emp.jobTitle ?? emp.department ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    {week.map((d, i) => {
                      const shift = shiftFor(emp.id, i);
                      return (
                        <td
                          key={i}
                          className={cn(
                            "px-2 py-2 align-middle",
                            i === todayIndex && "border-x border-[#714B67]/40 bg-[#F3EDF2]/30"
                          )}
                        >
                          <span
                            className={cn(
                              "block rounded px-1.5 py-1 text-center text-[11px] font-medium",
                              shift.chip
                            )}
                          >
                            {shift.key === "off" ? "—" : `${shift.label} ${shift.time}`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
