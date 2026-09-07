"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeIndianRupee,
  Boxes,
  CalendarClock,
  FileText,
  IndianRupee,
  PackageX,
  Receipt,
  RotateCw,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useVitta } from "@/lib/vitta/store";
import { fmtMoney, fmtDate } from "@/lib/vitta/format";
import { StatCard, type StatTone } from "@/components/vitta/ui/stat-card";
import { PageHeader } from "@/components/vitta/ui/page-header";

interface DashboardData {
  stats: {
    paidRevenue: number;
    receivables: number;
    overdue: number;
    bookedRevenue: number;
    openQuotations: number;
    quotationValue: number;
    openLeads: number;
    openLeadValue: number;
    wonValue: number;
    headcount: number;
    onLeaveCount: number;
    activeProjects: number;
    openTickets: number;
    lowStockCount: number;
    outOfStockCount: number;
    posTodayCount: number;
    posTodayTotal: number;
  };
  leadsByStage: { stage: string; count: number; value: number }[];
  salesByMonth: { label: string; total: number }[];
  recentActivity: { type: string; label: string; sub: string; at: string }[];
  lowStock: { name: string; sku: string; qty: number }[];
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "#31A3DD" },
  qualified: { label: "Qualified", color: "#00A88D" },
  proposition: { label: "Proposition", color: "#FBB04E" },
  negotiation: { label: "Negotiation", color: "#F8931D" },
  won: { label: "Won", color: "#2E9E68" },
  lost: { label: "Lost", color: "#D9534F" },
};

const ACTIVITY_ICONS: Record<string, { icon: React.ReactNode; tone: StatTone }> = {
  lead: { icon: <Target className="h-4 w-4" />, tone: "violet" },
  sale: { icon: <Receipt className="h-4 w-4" />, tone: "emerald" },
  invoice: { icon: <FileText className="h-4 w-4" />, tone: "amber" },
  ticket: { icon: <Activity className="h-4 w-4" />, tone: "sky" },
};

const QUICK_APPS = [
  { id: "crm", label: "CRM" },
  { id: "sales", label: "Sales" },
  { id: "invoicing", label: "Accounting", actual: "accounting" },
  { id: "inventory", label: "Inventory" },
  { id: "project", label: "Project" },
  { id: "hr", label: "HR" },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const openApp = useVitta((s) => s.openApp);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error(`Dashboard failed (${res.status})`);
      setData((await res.json()) as DashboardData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const s = data?.stats;
  const maxMonth = Math.max(1, ...(data?.salesByMonth.map((m) => m.total) ?? [1]));
  const funnelMax = Math.max(1, ...(data?.leadsByStage.map((l) => l.value) ?? [1]));

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Dashboard"
        onRefresh={load}
        loading={loading}
        actions={
          <Button className="h-9" onClick={() => openApp("crm")}>
            <Target className="mr-1 h-4 w-4" /> Go to CRM
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#F3EDF2] px-3 py-1 text-xs font-medium text-[#714B67]">
            Company overview · FY 2025
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => openApp(app.actual ?? app.id)}
                className="inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-[#714B67]/40 hover:text-[#714B67]"
              >
                {app.label} <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="scroll-slim flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        {loading || !s ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] rounded-xl" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Booked revenue"
                value={fmtMoney(s.bookedRevenue, true)}
                sub={`${s.openQuotations} quotations open · ${fmtMoney(s.quotationValue, true)}`}
                icon={<TrendingUp className="h-5 w-5" />}
                tone="emerald"
                onClick={() => openApp("sales")}
              />
              <StatCard
                label="Paid invoices"
                value={fmtMoney(s.paidRevenue, true)}
                sub={`Receivables ${fmtMoney(s.receivables, true)}`}
                icon={<BadgeIndianRupee className="h-5 w-5" />}
                tone="brand"
                onClick={() => openApp("accounting")}
              />
              <StatCard
                label="Overdue invoices"
                value={fmtMoney(s.overdue, true)}
                sub="Follow up with customers"
                icon={<CalendarClock className="h-5 w-5" />}
                tone={s.overdue > 0 ? "rose" : "emerald"}
                onClick={() => openApp("accounting")}
              />
              <StatCard
                label="Pipeline value"
                value={fmtMoney(s.openLeadValue, true)}
                sub={`${s.openLeads} open leads · won ${fmtMoney(s.wonValue, true)}`}
                icon={<Target className="h-5 w-5" />}
                tone="violet"
                onClick={() => openApp("crm")}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Sales chart */}
              <section className="rounded-xl border bg-white p-4 shadow-sm md:p-5" aria-label="Sales by month">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Sales by month</h2>
                  <span className="text-xs text-muted-foreground">Confirmed orders · last 6 months</span>
                </div>
                <div className="flex h-52 items-end gap-2 sm:gap-3">
                  {data.salesByMonth.map((m) => (
                    <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {m.total > 0 ? fmtMoney(m.total, true) : ""}
                      </span>
                      <div className="flex h-32 w-full items-end">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-[#714B67] to-[#9A5B8F] transition-all hover:opacity-80"
                          style={{ height: `${Math.max(3, (m.total / maxMonth) * 100)}%` }}
                          role="img"
                          aria-label={`${m.label}: ${fmtMoney(m.total)}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">{m.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Leads funnel */}
              <section className="rounded-xl border bg-white p-4 shadow-sm md:p-5" aria-label="Leads funnel">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">CRM pipeline</h2>
                  <button
                    onClick={() => openApp("crm")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#714B67] hover:underline"
                  >
                    Open CRM <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {data.leadsByStage.map((l) => {
                    const meta = STAGE_LABELS[l.stage] ?? { label: l.stage, color: "#94a3b8" };
                    return (
                      <div key={l.stage} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">{meta.label}</span>
                        <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted/50">
                          <div
                            className="flex h-full items-center justify-end rounded-md px-2 text-[10px] font-semibold text-white"
                            style={{ width: `${Math.max(8, (l.value / funnelMax) * 100)}%`, backgroundColor: meta.color }}
                          >
                            {l.value > 0 ? fmtMoney(l.value, true) : ""}
                          </div>
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">{l.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Recent activity */}
              <section className="rounded-xl border bg-white p-4 shadow-sm md:p-5" aria-label="Recent activity">
                <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
                <ul className="space-y-2.5">
                  {data.recentActivity.map((a, i) => {
                    const meta = ACTIVITY_ICONS[a.type] ?? ACTIVITY_ICONS.lead!;
                    return (
                      <li key={i} className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            meta.tone === "violet"
                              ? "bg-violet-50 text-violet-700"
                              : meta.tone === "emerald"
                                ? "bg-emerald-50 text-emerald-700"
                                : meta.tone === "amber"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {meta.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium">{a.label}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{a.sub}</div>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{fmtDate(a.at)}</span>
                      </li>
                    );
                  })}
                  {data.recentActivity.length === 0 && (
                    <li className="text-xs text-muted-foreground">No recent activity yet.</li>
                  )}
                </ul>
              </section>

              {/* Inventory alerts */}
              <section className="rounded-xl border bg-white p-4 shadow-sm md:p-5" aria-label="Inventory alerts">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Inventory alerts</h2>
                  <button
                    onClick={() => openApp("inventory")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#714B67] hover:underline"
                  >
                    Inventory <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-amber-50 p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5" /> Low stock
                    </div>
                    <div className="text-lg font-semibold text-amber-900">{s.lowStockCount}</div>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-800">
                      <PackageX className="h-3.5 w-3.5" /> Out of stock
                    </div>
                    <div className="text-lg font-semibold text-rose-900">{s.outOfStockCount}</div>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {data.lowStock.map((p) => (
                    <li key={p.sku} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{p.sku}</span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.qty === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.qty} left
                      </span>
                    </li>
                  ))}
                  {data.lowStock.length === 0 && <li className="text-xs text-muted-foreground">All products healthy.</li>}
                </ul>
              </section>

              {/* People & ops */}
              <section className="space-y-3" aria-label="Operations snapshot">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Headcount"
                    value={s.headcount}
                    sub={`${s.onLeaveCount} on leave`}
                    icon={<Users className="h-5 w-5" />}
                    tone="orange"
                    onClick={() => openApp("hr")}
                  />
                  <StatCard
                    label="Active projects"
                    value={s.activeProjects}
                    icon={<Boxes className="h-5 w-5" />}
                    tone="sky"
                    onClick={() => openApp("project")}
                  />
                  <StatCard
                    label="Open tickets"
                    value={s.openTickets}
                    icon={<Activity className="h-5 w-5" />}
                    tone="teal"
                    onClick={() => openApp("helpdesk")}
                  />
                  <StatCard
                    label="POS today"
                    value={fmtMoney(s.posTodayTotal, true)}
                    sub={`${s.posTodayCount} transactions`}
                    icon={<IndianRupee className="h-5 w-5" />}
                    tone="emerald"
                    onClick={() => openApp("pos")}
                  />
                </div>
                <div className="rounded-xl border bg-gradient-to-br from-[#F3EDF2] to-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#714B67]">
                    <RotateCw className="h-3.5 w-3.5" /> VITTA Enterprise 3.1
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    24 apps installed. Proprietary license — © 2025 VITTA Labs Pvt. Ltd.
                  </p>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
