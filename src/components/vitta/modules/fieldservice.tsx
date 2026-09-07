"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Plus, Search, Users, Wrench } from "lucide-react";
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
  { key: "new", label: "To Schedule", dot: "bg-sky-500" },
  { key: "in_progress", label: "On Site", dot: "bg-amber-500" },
  { key: "on_hold", label: "Blocked", dot: "bg-stone-400" },
  { key: "resolved", label: "Completed", dot: "bg-emerald-500" },
];

const STAGE_BADGE_MAP: Record<string, { label: string; className: string }> = {
  new: { label: "To Schedule", className: "bg-sky-100 text-sky-800 border-sky-200" },
  in_progress: { label: "On Site", className: "bg-amber-100 text-amber-800 border-amber-200" },
  on_hold: { label: "Blocked", className: "bg-stone-100 text-stone-700 border-stone-200" },
  resolved: { label: "Completed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function FieldServiceModule() {
  const { items, loading, reload, create, update, remove } = useResource<Ticket>("helpdesk", { category: "field" });
  const { items: customers } = useResource<{ id: string; name: string }>("contacts", { type: "customer" });

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

  const openCount = items.filter((t) => t.stage === "new" || t.stage === "in_progress").length;
  const highPriority = items.filter((t) => t.priority === "high").length;
  const completedRate = items.length
    ? Math.round((items.filter((t) => t.stage === "resolved").length / items.length) * 100)
    : 0;
  const technicians = new Set(items.map((t) => t.assignee).filter(Boolean)).size;

  const customerOptions = useMemo(
    () => [
      { value: "", label: "— No customer —" },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ],
    [customers]
  );

  const FIELDS: FieldDef[] = [
    { name: "title", label: "Intervention", type: "text", required: true, full: true, placeholder: "e.g. AC maintenance visit" },
    { name: "customerId", label: "Customer", type: "select", options: customerOptions },
    { name: "stage", label: "Stage", type: "select", defaultValue: "new", options: STAGES.map((s) => ({ value: s.key, label: s.label })) },
    { name: "priority", label: "Priority", type: "select", defaultValue: "medium", options: PRIORITY_OPTIONS },
    { name: "assignee", label: "Technician", type: "text", placeholder: "e.g. Ravi Kumar" },
    { name: "description", label: "Description", type: "textarea", full: true, placeholder: "Reported issue, parts needed, site access notes..." },
    { name: "category", label: "Category", type: "select", defaultValue: "field", options: [
      { value: "field", label: "Field intervention" },
    ]},
  ];

  async function handleSave(values: RecordValues) {
    const payload = {
      title: values.title,
      customerId: values.customerId || null,
      stage: (values.stage || "new") as Ticket["stage"],
      priority: (values.priority || "medium") as Ticket["priority"],
      assignee: values.assignee || null,
      description: values.description || null,
      category: "field" as Ticket["category"],
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Intervention updated");
    } else {
      await create(payload);
      toast.success("Intervention created");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("Intervention deleted");
    setDrawer({ open: false, item: null });
  }

  async function setStage(t: Ticket, stage: string) {
    await update(t.id, { stage: stage as Ticket["stage"] });
    toast.success(`Moved to ${STAGES.find((s) => s.key === stage)?.label ?? stage}`);
  }

  const columns: Column<Ticket>[] = [
    {
      key: "title",
      header: "Intervention",
      render: (t) => <span className="font-medium">{t.title}</span>,
    },
    { key: "customerName", header: "Customer", hideSm: true, render: (t) => t.customerName ?? "—" },
    { key: "priority", header: "Priority", render: (t) => <StatusBadge status={t.priority} /> },
    {
      key: "assignee",
      header: "Assignee",
      hideMd: true,
      render: (t) =>
        t.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border">
              <AvatarFallback className="bg-[#F3EDF2] text-[9px] font-bold text-[#714B67]">
                {initials(t.assignee)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs">{t.assignee}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        ),
    },
    { key: "createdAt", header: "Created", hideSm: true, render: (t) => fmtDate(t.createdAt) },
    { key: "stage", header: "Stage", render: (t) => <StatusBadge status={t.stage} map={STAGE_BADGE_MAP} /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Field Service"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search interventions..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        }
      >
        <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
          <TabsList className="h-8">
            <TabsTrigger value="board" className="h-6 px-3 text-xs">Board</TabsTrigger>
            <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard label="Open interventions" value={openCount} sub="To schedule or on site" icon={<Wrench className="h-5 w-5" />} tone="brand" />
        <StatCard label="High priority" value={highPriority} icon={<MapPin className="h-5 w-5" />} tone="rose" />
        <StatCard label="Completed" value={`${completedRate}%`} sub={`${items.length} total`} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Technicians" value={technicians} icon={<Users className="h-5 w-5" />} tone="sky" />
      </div>

      {view === "board" ? (
        <Kanban
          stages={STAGES}
          items={filtered}
          getStage={(t) => t.stage}
          stageOptions={["new", "in_progress", "on_hold", "resolved"]}
          renderCard={(t) => (
            <div className="cursor-pointer" onClick={() => setDrawer({ open: true, item: t })}>
              <div className="font-medium leading-snug">{t.title}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.customerName ?? "No customer"}</div>
              <div className="mt-2.5 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <StatusBadge status={t.priority} />
                {t.assignee ? (
                  <Avatar className="ml-auto h-6 w-6 border">
                    <AvatarFallback className="bg-[#F3EDF2] text-[9px] font-bold text-[#714B67]">
                      {initials(t.assignee)}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
              </div>
            </div>
          )}
          onStageChange={setStage}
          loading={loading}
        />
      ) : (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(t) => setDrawer({ open: true, item: t })}
          loading={loading}
          emptyIcon={<Wrench className="h-7 w-7" />}
          emptyTitle="No interventions found"
          emptyDescription="Create a field intervention to dispatch a technician."
        />
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.title}` : "New Intervention"}
        description="On-site interventions dispatched to your field technicians."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item } : null}
        onSubmit={handleSave}
        onDelete={drawer.item ? handleDelete : undefined}
      />
    </div>
  );
}
