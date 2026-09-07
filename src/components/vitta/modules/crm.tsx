"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Calculator, Plus, Search, Star, Target, Trophy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { Kanban, type KanbanStage } from "@/components/vitta/ui/kanban";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { fmtMoney, fmtDate } from "@/lib/vitta/format";
import { cn } from "@/lib/utils";
import type { Lead, LeadStage } from "@/lib/vitta/types";

const STAGES: KanbanStage[] = [
  { key: "new", label: "New", dot: "bg-sky-500" },
  { key: "qualified", label: "Qualified", dot: "bg-teal-500" },
  { key: "proposition", label: "Proposition", dot: "bg-amber-500" },
  { key: "negotiation", label: "Negotiation", dot: "bg-orange-500" },
  { key: "won", label: "Won", dot: "bg-emerald-500" },
  { key: "lost", label: "Lost", dot: "bg-rose-500" },
];

const PRIORITY_OPTIONS = [
  { value: "0", label: "Cold" },
  { value: "1", label: "Warm" },
  { value: "2", label: "Hot" },
  { value: "3", label: "Very hot" },
];

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "campaign", label: "Campaign" },
  { value: "walk_in", label: "Walk-in" },
  { value: "partner", label: "Partner" },
];

function Stars({ value }: { value: number }) {
  const filled = Math.min(3, Math.max(0, value));
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`Priority ${filled} of 3`}>
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i < filled ? "fill-amber-400 text-amber-400" : "text-stone-300")}
        />
      ))}
    </span>
  );
}

/** "3d ago" style relative date for the kanban card footer. */
function relDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "—";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function CrmModule() {
  const { items, loading, reload, create, update } = useResource<Lead>("leads");
  const { items: employees } = useResource<{ id: string; name: string }>("employees");

  const [view, setView] = useState<"list" | "board">("board");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Lead | null }>({ open: false, item: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (l) =>
        l.name.toLowerCase().includes(needle) ||
        (l.company ?? "").toLowerCase().includes(needle) ||
        (l.contactName ?? "").toLowerCase().includes(needle)
    );
  }, [items, q]);

  const openLeads = items.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const pipelineValue = openLeads.reduce((a, l) => a + l.expectedRevenue, 0);
  const wonValue = items.filter((l) => l.stage === "won").reduce((a, l) => a + l.expectedRevenue, 0);
  const newCount = items.filter((l) => l.stage === "new").length;
  const avgDeal = openLeads.length ? pipelineValue / openLeads.length : 0;

  const ownerOptions = useMemo(
    () => [
      { value: "unassigned", label: "— Unassigned —" },
      ...employees.map((e) => ({ value: e.name, label: e.name })),
    ],
    [employees]
  );

  const FIELDS: FieldDef[] = useMemo(
    () => [
      { name: "name", label: "Opportunity", type: "text", required: true, full: true, placeholder: "e.g. Acme Corp — 50 licenses" },
      { name: "contactName", label: "Contact name", type: "text", placeholder: "e.g. Dana Wong" },
      { name: "company", label: "Company", type: "text", placeholder: "e.g. Acme Corp" },
      { name: "email", label: "Email", type: "email", placeholder: "name@company.com" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98xxx xxxxx" },
      { name: "expectedRevenue", label: "Expected Revenue (₹)", type: "number", step: "0.01", placeholder: "0.00" },
      {
        name: "stage",
        label: "Stage",
        type: "select",
        defaultValue: "new",
        options: STAGES.map((s) => ({ value: s.key, label: s.label })),
      },
      { name: "priority", label: "Priority", type: "select", defaultValue: "0", options: PRIORITY_OPTIONS },
      { name: "source", label: "Source", type: "select", options: SOURCE_OPTIONS },
      { name: "ownerName", label: "Salesperson", type: "select", options: ownerOptions },
      { name: "notes", label: "Notes", type: "textarea", full: true, placeholder: "Internal notes, next steps..." },
    ],
    [ownerOptions]
  );

  async function handleSave(values: RecordValues) {
    const payload = {
      name: values.name?.trim() ?? "",
      contactName: values.contactName || null,
      company: values.company || null,
      email: values.email || null,
      phone: values.phone || null,
      expectedRevenue: Number(values.expectedRevenue || 0),
      stage: (values.stage || "new") as LeadStage,
      priority: Number(values.priority || 0),
      source: values.source || null,
      ownerName: values.ownerName && values.ownerName !== "unassigned" ? values.ownerName : null,
      notes: values.notes || null,
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Lead updated");
    } else {
      await create(payload);
      toast.success("Lead created");
    }
    setDrawer({ open: false, item: null });
  }

  async function setStage(lead: Lead, stage: string) {
    await update(lead.id, { stage: stage as LeadStage });
    toast.success(`Moved to ${STAGES.find((s) => s.key === stage)?.label ?? stage}`);
  }

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Lead",
      render: (l) => (
        <div className="min-w-0">
          <div className="truncate font-semibold">{l.name}</div>
          <div className="truncate text-xs text-muted-foreground">{l.company ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      hideSm: true,
      render: (l) => (
        <div className="min-w-0">
          <div className="truncate">{l.contactName ?? "—"}</div>
          <div className="truncate text-xs text-muted-foreground">{l.phone ?? ""}</div>
        </div>
      ),
    },
    {
      key: "expectedRevenue",
      header: "Expected Revenue",
      render: (l) => <span className="font-medium">{fmtMoney(l.expectedRevenue)}</span>,
    },
    { key: "priority", header: "Priority", render: (l) => <Stars value={l.priority} /> },
    { key: "stage", header: "Stage", render: (l) => <StatusBadge status={l.stage} /> },
    { key: "ownerName", header: "Owner", hideMd: true, render: (l) => l.ownerName ?? "—" },
    { key: "createdAt", header: "Created", hideMd: true, render: (l) => fmtDate(l.createdAt) },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="CRM"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search leads..."
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

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard
          label="Open pipeline value"
          value={fmtMoney(pipelineValue, true)}
          sub={`${openLeads.length} open deals`}
          icon={<Target className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Won value"
          value={fmtMoney(wonValue, true)}
          sub={`${items.filter((l) => l.stage === "won").length} won`}
          icon={<Trophy className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="New leads"
          value={newCount}
          sub={`${items.length} total`}
          icon={<UserPlus className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Avg open deal"
          value={fmtMoney(avgDeal, true)}
          icon={<Calculator className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {view === "list" ? (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(l) => setDrawer({ open: true, item: l })}
          loading={loading}
          emptyIcon={<Search className="h-7 w-7" />}
          emptyTitle="No leads found"
          emptyDescription="Create your first lead to start building the pipeline."
        />
      ) : (
        <Kanban
          stages={STAGES}
          items={filtered}
          getStage={(l) => l.stage}
          renderCard={(l) => (
            <div className="cursor-pointer" onClick={() => setDrawer({ open: true, item: l })}>
              <div className="font-medium leading-snug">{l.name}</div>
              {l.company ? <div className="truncate text-xs text-muted-foreground">{l.company}</div> : null}
              <div className="mt-2">
                <Stars value={l.priority} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="shrink-0 font-semibold text-emerald-700">{fmtMoney(l.expectedRevenue)}</span>
                <span className="truncate text-muted-foreground">{l.contactName ?? ""}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2 text-[11px] text-muted-foreground">
                <span className="truncate">{l.ownerName ?? "Unassigned"}</span>
                <span className="shrink-0">{relDate(l.createdAt)}</span>
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
        title={drawer.item ? `Edit — ${drawer.item.name}` : "New Lead"}
        description="Track opportunities from first contact to closed deal."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item } : null}
        onSubmit={handleSave}
      />
    </div>
  );
}
