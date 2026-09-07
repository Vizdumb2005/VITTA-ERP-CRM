"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Boxes, CalendarClock, CheckCircle2, Cog, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { Kanban, type KanbanStage } from "@/components/vitta/ui/kanban";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { fmtDate, initials, toDateInput } from "@/lib/vitta/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Employee, ManufacturingOrder, Product } from "@/lib/vitta/types";

const STAGES: KanbanStage[] = [
  { key: "draft", label: "Draft", dot: "bg-stone-400" },
  { key: "confirmed", label: "Confirmed", dot: "bg-sky-500" },
  { key: "in_progress", label: "In Progress", dot: "bg-amber-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
  { key: "cancelled", label: "Cancelled", dot: "bg-rose-500" },
];

const STATUS_OPTIONS = STAGES.map((s) => ({ value: s.key, label: s.label }));

/** Radix Select forbids empty-string item values, so optional choices use a sentinel. */
const NONE = "__none__";

const OPEN_STATUSES = ["draft", "confirmed", "in_progress"];

function isDelayed(mo: ManufacturingOrder): boolean {
  if (!mo.scheduledDate) return false;
  const sched = new Date(mo.scheduledDate);
  sched.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sched < today && OPEN_STATUSES.includes(mo.status);
}

export default function ManufacturingModule() {
  const { items, loading, reload, create, update, remove } = useResource<ManufacturingOrder>("manufacturing");
  const { items: products } = useResource<Product>("products");
  const { items: employees } = useResource<Employee>("employees");

  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: ManufacturingOrder | null }>({ open: false, item: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (mo) =>
        mo.number.toLowerCase().includes(needle) ||
        (mo.productName ?? "").toLowerCase().includes(needle) ||
        (mo.assignee ?? "").toLowerCase().includes(needle)
    );
  }, [items, q]);

  const openMos = items.filter((mo) => OPEN_STATUSES.includes(mo.status)).length;
  const inProgress = items.filter((mo) => mo.status === "in_progress").length;
  const done = items.filter((mo) => mo.status === "done").length;
  const delayed = items.filter(isDelayed).length;

  const productOptions = useMemo(() => products.map((p) => ({ value: p.id, label: p.name })), [products]);
  const assigneeOptions = useMemo(
    () => [{ value: NONE, label: "— Unassigned —" }, ...employees.map((e) => ({ value: e.name, label: e.name }))],
    [employees]
  );

  const FIELDS: FieldDef[] = useMemo(
    () => [
      { name: "productId", label: "Product", type: "select", required: true, options: productOptions, placeholder: "Select product..." },
      { name: "qty", label: "Quantity (units)", type: "number", required: true, placeholder: "e.g. 100" },
      { name: "status", label: "Status", type: "select", defaultValue: "draft", options: STATUS_OPTIONS },
      { name: "scheduledDate", label: "Scheduled date", type: "date" },
      { name: "assignee", label: "Assignee", type: "select", options: assigneeOptions, defaultValue: NONE },
    ],
    [productOptions, assigneeOptions]
  );

  async function handleSave(values: RecordValues) {
    const payload = {
      productId: values.productId,
      qty: Number(values.qty || 0),
      status: (values.status || "draft") as ManufacturingOrder["status"],
      scheduledDate: values.scheduledDate || null,
      assignee: values.assignee && values.assignee !== NONE ? values.assignee : null,
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Manufacturing order updated");
    } else {
      await create(payload);
      toast.success("Manufacturing order created");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("Manufacturing order deleted");
    setDrawer({ open: false, item: null });
  }

  async function setStage(mo: ManufacturingOrder, status: string) {
    await update(mo.id, { status: status as ManufacturingOrder["status"] });
    toast.success(`Moved to ${STAGES.find((s) => s.key === status)?.label ?? status}`);
  }

  async function advance(mo: ManufacturingOrder) {
    const next: ManufacturingOrder["status"] = mo.status === "confirmed" ? "in_progress" : "done";
    await update(mo.id, { status: next });
    toast.success(next === "in_progress" ? `Production started — ${mo.number}` : `Production finished — ${mo.number}`);
  }

  const columns: Column<ManufacturingOrder>[] = [
    { key: "number", header: "Order", render: (mo) => <span className="font-mono font-medium">{mo.number}</span> },
    { key: "productName", header: "Product", render: (mo) => mo.productName ?? "—" },
    { key: "qty", header: "Qty", render: (mo) => <span className="font-medium">{mo.qty}</span> },
    { key: "scheduledDate", header: "Scheduled", hideSm: true, render: (mo) => fmtDate(mo.scheduledDate) },
    { key: "assignee", header: "Assignee", hideMd: true, render: (mo) => mo.assignee ?? "—" },
    { key: "status", header: "Status", render: (mo) => <StatusBadge status={mo.status} /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Manufacturing"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search orders..."
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
        <StatCard label="Open MOs" value={openMos} sub={`${items.length} total`} icon={<Boxes className="h-5 w-5" />} tone="brand" />
        <StatCard label="In progress" value={inProgress} icon={<Cog className="h-5 w-5" />} tone="sky" />
        <StatCard label="Done" value={done} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Delayed" value={delayed} icon={<CalendarClock className="h-5 w-5" />} tone="rose" />
      </div>

      {view === "list" ? (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(mo) => setDrawer({ open: true, item: mo })}
          loading={loading}
          emptyIcon={<Search className="h-7 w-7" />}
          emptyTitle="No manufacturing orders found"
          emptyDescription="Create your first manufacturing order to plan production."
        />
      ) : (
        <Kanban
          stages={STAGES}
          items={filtered}
          getStage={(mo) => mo.status}
          renderCard={(mo) => (
            <div className="cursor-pointer" onClick={() => setDrawer({ open: true, item: mo })}>
              <div className="font-mono text-sm font-bold">{mo.number}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{mo.productName ?? "—"}</div>
              <div className="mt-0.5 text-xs font-medium">{mo.qty} units</div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className={cn("text-xs", isDelayed(mo) ? "font-medium text-rose-600" : "text-muted-foreground")}>
                  {fmtDate(mo.scheduledDate)}
                </span>
                <Avatar className="ml-auto h-6 w-6 border">
                  <AvatarFallback className="bg-[#F3EDF2] text-[9px] font-bold text-[#714B67]">
                    {initials(mo.assignee)}
                  </AvatarFallback>
                </Avatar>
              </div>
              {(mo.status === "confirmed" || mo.status === "in_progress") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2.5 h-8 w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    advance(mo);
                  }}
                >
                  {mo.status === "confirmed" ? "Start" : "Finish"}
                </Button>
              )}
            </div>
          )}
          onStageChange={setStage}
          loading={loading}
        />
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.number}` : "New Manufacturing Order"}
        description="Plan and track production of goods from draft to done."
        fields={FIELDS}
        initial={
          drawer.item
            ? {
                ...drawer.item,
                scheduledDate: toDateInput(drawer.item.scheduledDate),
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
