"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, LifeBuoy, Plus, Search, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { Kanban, type KanbanStage } from "@/components/vitta/ui/kanban";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { fmtDate, initials } from "@/lib/vitta/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Ticket } from "@/lib/vitta/types";

const STAGES: KanbanStage[] = [
  { key: "new", label: "New", dot: "bg-sky-500" },
  { key: "in_progress", label: "In Progress", dot: "bg-amber-500" },
  { key: "on_hold", label: "On Hold", dot: "bg-stone-400" },
  { key: "resolved", label: "Resolved", dot: "bg-emerald-500" },
];

const STAGE_OPTIONS = [
  ...STAGES.map((s) => ({ value: s.key, label: s.label })),
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/** Radix Select forbids empty-string item values, so optional choices use a sentinel. */
const NONE = "__none__";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function HelpdeskModule() {
  const { items, loading, reload, create, update, remove } = useResource<Ticket>("helpdesk");
  const { items: customers } = useResource<{ id: string; name: string }>("contacts", { type: "customer" });
  const { items: employees } = useResource<{ id: string; name: string }>("employees");

  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Ticket | null }>({ open: false, item: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        (t.customerName ?? "").toLowerCase().includes(needle) ||
        (t.assignee ?? "").toLowerCase().includes(needle)
    );
  }, [items, q]);

  const openTickets = items.filter((t) => t.stage === "new" || t.stage === "in_progress");
  const highOpen = openTickets.filter((t) => t.priority === "high").length;
  const solvedPct = items.length
    ? Math.round((items.filter((t) => t.stage === "resolved").length / items.length) * 100)
    : 0;
  const unassigned = openTickets.filter((t) => !t.assignee).length;

  const customerOptions = useMemo(
    () => [{ value: NONE, label: "— No customer —" }, ...customers.map((c) => ({ value: c.id, label: c.name }))],
    [customers]
  );
  const assigneeOptions = useMemo(
    () => [{ value: NONE, label: "— Unassigned —" }, ...employees.map((e) => ({ value: e.name, label: e.name }))],
    [employees]
  );

  const FIELDS: FieldDef[] = useMemo(
    () => [
      { name: "title", label: "Title", type: "text", required: true, full: true, placeholder: "e.g. Cannot access billing portal" },
      { name: "customerId", label: "Customer", type: "select", options: customerOptions, defaultValue: NONE },
      { name: "stage", label: "Stage", type: "select", defaultValue: "new", options: STAGE_OPTIONS },
      { name: "priority", label: "Priority", type: "select", defaultValue: "medium", options: PRIORITY_OPTIONS },
      { name: "assignee", label: "Assignee", type: "select", options: assigneeOptions, defaultValue: NONE },
      { name: "description", label: "Description", type: "textarea", full: true, placeholder: "Describe the issue..." },
    ],
    [customerOptions, assigneeOptions]
  );

  async function handleSave(values: RecordValues) {
    const payload = {
      title: values.title,
      category: "helpdesk" as const,
      customerId: values.customerId && values.customerId !== NONE ? values.customerId : null,
      stage: (values.stage || "new") as Ticket["stage"],
      priority: (values.priority || "medium") as Ticket["priority"],
      assignee: values.assignee && values.assignee !== NONE ? values.assignee : null,
      description: values.description || null,
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Ticket updated");
    } else {
      await create(payload);
      toast.success("Ticket created");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("Ticket deleted");
    setDrawer({ open: false, item: null });
  }

  async function setStage(t: Ticket, stage: string) {
    await update(t.id, { stage: stage as Ticket["stage"] });
    toast.success(`Moved to ${STAGES.find((s) => s.key === stage)?.label ?? stage}`);
  }

  const columns: Column<Ticket>[] = [
    {
      key: "title",
      header: "Ticket",
      render: (t) => <span className="font-medium">{t.title}</span>,
    },
    { key: "customerName", header: "Customer", hideSm: true, render: (t) => t.customerName ?? "—" },
    { key: "priority", header: "Priority", render: (t) => <StatusBadge status={t.priority} /> },
    { key: "assignee", header: "Assignee", hideMd: true, render: (t) => t.assignee ?? "—" },
    { key: "createdAt", header: "Created", render: (t) => fmtDate(t.createdAt) },
    { key: "stage", header: "Stage", render: (t) => <StatusBadge status={t.stage} /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Helpdesk"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search tickets..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
            <TabsList className="h-8">
              <TabsTrigger value="board" className="h-6 px-3 text-xs">Board</TabsTrigger>
              <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard label="Open tickets" value={openTickets.length} sub={`${items.length} total`} icon={<LifeBuoy className="h-5 w-5" />} tone="sky" />
        <StatCard label="High priority open" value={highOpen} icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
        <StatCard label="Solved" value={`${solvedPct}%`} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Unassigned" value={unassigned} icon={<UserX className="h-5 w-5" />} tone="rose" />
      </div>

      {view === "list" ? (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(t) => setDrawer({ open: true, item: t })}
          loading={loading}
          emptyIcon={<Search className="h-7 w-7" />}
          emptyTitle="No tickets found"
          emptyDescription="Create your first support ticket to start tracking customer issues."
        />
      ) : (
        <Kanban
          stages={STAGES}
          items={filtered}
          getStage={(t) => t.stage}
          renderCard={(t) => (
            <div className="cursor-pointer" onClick={() => setDrawer({ open: true, item: t })}>
              <div className="line-clamp-2 font-medium leading-snug">{t.title}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{t.customerName ?? "No customer"}</div>
              <div className="mt-2.5 flex items-center gap-2">
                <StatusBadge status={t.priority} />
                <Avatar className="ml-auto h-6 w-6 border">
                  <AvatarFallback className="bg-[#F3EDF2] text-[9px] font-bold text-[#714B67]">
                    {initials(t.assignee)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground">{timeAgo(t.createdAt)}</span>
              </div>
            </div>
          )}
          onStageChange={setStage}
          loading={loading}
        />
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.title}` : "New Ticket"}
        description="Customer support tickets tracked through resolution stages."
        fields={FIELDS}
        initial={
          drawer.item
            ? {
                ...drawer.item,
                customerId: drawer.item.customerId ?? NONE,
                assignee: drawer.item.assignee ?? NONE,
              }
            : null
        }
        onSubmit={handleSave}
        onDelete={drawer.item ? handleDelete : undefined}
      />
    </div>
  );
}
