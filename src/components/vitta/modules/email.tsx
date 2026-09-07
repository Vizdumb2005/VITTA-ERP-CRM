"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, MousePointerClick, Paperclip, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { fmtDate, fmtNumber } from "@/lib/vitta/format";
import type { Campaign } from "@/lib/vitta/types";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-stone-100 text-stone-700 border-stone-200" },
  sent: { label: "Sent", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function EmailModule() {
  const { items, loading, reload, create, update } = useResource<Campaign>("campaigns");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Campaign | null }>({ open: false, item: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.subject ?? "").toLowerCase().includes(needle)
    );
  }, [items, q]);

  const sentItems = items.filter((c) => c.status === "sent");
  const recipientsSent = sentItems.reduce((a, c) => a + c.recipients, 0);
  const opens = sentItems.reduce((a, c) => a + c.opens, 0);
  const clicks = sentItems.reduce((a, c) => a + c.clicks, 0);
  const openRate = recipientsSent ? Math.round((opens / recipientsSent) * 100) : 0;
  const clickRate = recipientsSent ? Math.round((clicks / recipientsSent) * 100) : 0;
  const drafts = items.filter((c) => c.status === "draft").length;

  async function sendCampaign(c: Campaign) {
    await update(c.id, { status: "sent" });
    toast.success("Campaign sent — stats will populate shortly");
  }

  async function handleSave(values: RecordValues) {
    const payload = {
      name: values.name,
      subject: values.subject ?? "",
      status: (values.status || "draft") as Campaign["status"],
      recipients: Number(values.recipients || 0),
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Campaign updated");
    } else {
      await create(payload);
      toast.success("Campaign created");
    }
    setDrawer({ open: false, item: null });
  }

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      header: "Campaign",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3EDF2] text-[#714B67]">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{c.name}</div>
            <div className="truncate text-xs text-muted-foreground">{c.subject || "No subject"}</div>
          </div>
        </div>
      ),
    },
    { key: "recipients", header: "Recipients", render: (c) => fmtNumber(c.recipients) },
    {
      key: "opens",
      header: "Open rate",
      render: (c) =>
        c.status === "sent" ? (
          <span className="font-medium">{recipientsSent ? Math.round((c.opens / c.recipients) * 100) : 0}%</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "clicks",
      header: "Click rate",
      render: (c) =>
        c.status === "sent" ? (
          <span className="font-medium">{c.recipients ? Math.round((c.clicks / c.recipients) * 100) : 0}%</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { key: "sentAt", header: "Sent", hideSm: true, render: (c) => fmtDate(c.sentAt) },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} map={STATUS_MAP} /> },
    {
      key: "actions",
      header: "",
      render: (c) =>
        c.status === "draft" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              sendCampaign(c);
            }}
            aria-label={`Send campaign ${c.name}`}
          >
            <Send className="mr-1 h-3.5 w-3.5" /> Send
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Email Marketing"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search campaigns..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> New campaign
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard label="Emails sent" value={fmtNumber(recipientsSent)} sub={`${sentItems.length} campaigns delivered`} icon={<Mail className="h-5 w-5" />} tone="brand" />
        <StatCard label="Avg open rate" value={`${openRate}%`} icon={<Mail className="h-5 w-5" />} tone="teal" />
        <StatCard label="Avg click rate" value={`${clickRate}%`} icon={<MousePointerClick className="h-5 w-5" />} tone="sky" />
        <StatCard label="Drafts" value={drafts} sub="Ready to send" icon={<Paperclip className="h-5 w-5" />} tone="amber" />
      </div>

      <DataTable
        columns={columns}
        items={filtered}
        onRowClick={(c) => setDrawer({ open: true, item: c })}
        loading={loading}
        emptyIcon={<Mail className="h-7 w-7" />}
        emptyTitle="No campaigns yet"
        emptyDescription="Create your first email campaign and hit Send when it is ready."
      />

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.name}` : "New Campaign"}
        description="Newsletters and promotions sent from your own domain."
        fields={[
          { name: "name", label: "Campaign name", type: "text", required: true, full: true, placeholder: "e.g. Diwali sale announcement" },
          { name: "subject", label: "Email subject", type: "text", full: true, placeholder: "e.g. Flat 30% off this week only" },
          { name: "status", label: "Status", type: "select", defaultValue: "draft", options: [
            { value: "draft", label: "Draft" },
            { value: "sent", label: "Sent" },
          ]},
          { name: "recipients", label: "Recipients", type: "number", defaultValue: "0" },
        ]}
        initial={drawer.item ? { ...drawer.item } : null}
        onSubmit={handleSave}
      />
    </div>
  );
}
