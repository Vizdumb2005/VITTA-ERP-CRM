"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCcw, CreditCard, TrendingUp, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { Kanban, type KanbanStage } from "@/components/vitta/ui/kanban";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { fmtMoney, fmtDate, initials } from "@/lib/vitta/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Subscription } from "@/lib/vitta/types";

const STAGES: KanbanStage[] = [
  { key: "active", label: "Active", dot: "bg-emerald-500" },
  { key: "paused", label: "Paused", dot: "bg-stone-400" },
  { key: "churned", label: "Churned", dot: "bg-rose-500" },
];

function useSubFields(customerOptions: FieldDef["options"]): FieldDef[] {
  return useMemo(() => [
    { name: "name", label: "Subscription name", type: "text", required: true, full: true, placeholder: "e.g. Acme Corp — Gold plan" },
    { name: "plan", label: "Plan", type: "select", required: true, defaultValue: "starter", options: [
      { value: "starter", label: "Starter" },
      { value: "gold", label: "Gold" },
      { value: "enterprise", label: "Enterprise" },
    ]},
    { name: "amount", label: "Monthly amount (₹)", type: "number", required: true, step: "0.01" },
    { name: "status", label: "Status", type: "select", defaultValue: "active", options: STAGES.map((s) => ({ value: s.key, label: s.label })) },
    { name: "renewalDate", label: "Next renewal", type: "date" },
    { name: "customerId", label: "Customer", type: "select", options: customerOptions },
  ], [customerOptions]);
}

export default function SubscriptionsModule() {
  const { items, loading, reload, create, update, remove } = useResource<Subscription>("subscriptions");
  const { items: customers } = useResource<{ id: string; name: string }>("contacts", { type: "customer" });

  const [view, setView] = useState<"list" | "board">("list");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Subscription | null }>({ open: false, item: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.plan.toLowerCase().includes(needle) ||
        (s.customerName ?? "").toLowerCase().includes(needle)
    );
  }, [items, q]);

  const mrr = items.filter((s) => s.status === "active").reduce((a, s) => a + s.amount, 0);
  const activeCount = items.filter((s) => s.status === "active").length;
  const churnRate = items.length ? Math.round((items.filter((s) => s.status === "churned").length / items.length) * 100) : 0;

  const customerOptions = useMemo(
    () => [
      { value: "__none__", label: "— No customer —" },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ],
    [customers]
  );
  const FIELDS = useSubFields(customerOptions);

  async function handleSave(values: RecordValues) {
    const payload = {
      name: values.name,
      plan: values.plan as Subscription["plan"],
      amount: Number(values.amount || 0),
      status: (values.status || "active") as Subscription["status"],
      renewalDate: values.renewalDate || null,
      customerId: values.customerId && values.customerId !== "__none__" ? values.customerId : null,
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Subscription updated");
    } else {
      await create(payload);
      toast.success("Subscription created");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("Subscription deleted");
    setDrawer({ open: false, item: null });
  }

  async function setStatus(item: Subscription, status: string) {
    await update(item.id, { status: status as Subscription["status"] });
    toast.success(`Moved to ${STAGES.find((s) => s.key === status)?.label}`);
  }

  const columns: Column<Subscription>[] = [
    {
      key: "name",
      header: "Subscription",
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="bg-[#F3EDF2] text-[10px] font-bold text-[#714B67]">
              {initials(s.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium">{s.name}</div>
            <div className="text-xs text-muted-foreground">{s.customerName ?? "No customer"}</div>
          </div>
        </div>
      ),
    },
    { key: "plan", header: "Plan", hideMd: true, render: (s) => <span className="capitalize">{s.plan}</span> },
    { key: "amount", header: "MRR", render: (s) => <span className="font-medium">{fmtMoney(s.amount)}</span> },
    { key: "renewalDate", header: "Next renewal", hideSm: true, render: (s) => fmtDate(s.renewalDate) },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Subscriptions"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search subscriptions..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "board")}>
            <TabsList className="h-8">
              <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
              <TabsTrigger value="board" className="h-6 px-3 text-xs">Board</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-3 md:px-6">
        <StatCard label="Monthly recurring revenue" value={fmtMoney(mrr)} icon={<TrendingUp className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Active subscriptions" value={activeCount} sub={`${items.length} total`} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Churn rate" value={`${churnRate}%`} icon={<CreditCard className="h-5 w-5" />} tone="rose" />
      </div>

      {view === "list" ? (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(item) => setDrawer({ open: true, item })}
          loading={loading}
          emptyIcon={<Search className="h-7 w-7" />}
          emptyTitle="No subscriptions found"
          emptyDescription="Create your first subscription to track recurring revenue."
        />
      ) : (
        <Kanban
          stages={STAGES}
          items={filtered}
          getStage={(s) => s.status}
          renderCard={(s) => (
            <div className="cursor-pointer" onClick={() => setDrawer({ open: true, item: s })}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-snug">{s.name}</span>
                <span className="shrink-0 text-sm font-semibold text-emerald-700">{fmtMoney(s.amount)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{s.plan} plan</span>
                <span>Renews {fmtDate(s.renewalDate)}</span>
              </div>
            </div>
          )}
          onStageChange={setStatus}
          loading={loading}
        />
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.name}` : "New Subscription"}
        description="Recurring revenue contracts billed monthly."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item, renewalDate: drawer.item.renewalDate?.slice(0, 10) ?? "" } : null}
        onSubmit={handleSave}
        onDelete={drawer.item ? handleDelete : undefined}
      />
    </div>
  );
}
