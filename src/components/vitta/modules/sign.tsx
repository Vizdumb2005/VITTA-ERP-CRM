"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCheck, FileSignature, Plus, PenLine, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { fmtDate } from "@/lib/vitta/format";
import type { SignDoc } from "@/lib/vitta/types";

const FIELDS: FieldDef[] = [
  { name: "name", label: "Document name", type: "text", required: true, full: true, placeholder: "e.g. Employment contract — R. Iyer" },
  { name: "signer", label: "Signer", type: "text", required: true, placeholder: "Full name of the signer" },
  { name: "status", label: "Status", type: "select", defaultValue: "to_sign", options: [
    { value: "to_sign", label: "To Sign" },
    { value: "signed", label: "Signed" },
  ]},
];

export default function SignModule() {
  const { items, loading, reload, create, update, remove } = useResource<SignDoc>("sign");
  const [view, setView] = useState<"list" | "cards">("list");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: SignDoc | null }>({ open: false, item: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (d) => d.name.toLowerCase().includes(needle) || d.signer.toLowerCase().includes(needle)
    );
  }, [items, q]);

  const toSign = items.filter((d) => d.status === "to_sign").length;
  const signed = items.filter((d) => d.status === "signed").length;
  const completionRate = items.length ? Math.round((signed / items.length) * 100) : 0;

  async function markSigned(doc: SignDoc) {
    await update(doc.id, { status: "signed" });
    toast.success("Document signed");
  }

  async function handleSave(values: RecordValues) {
    const payload = {
      name: values.name,
      signer: values.signer,
      status: (values.status || "to_sign") as SignDoc["status"],
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Signature request updated");
    } else {
      await create(payload);
      toast.success("Signature request sent");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("Signature request deleted");
    setDrawer({ open: false, item: null });
  }

  const columns: Column<SignDoc>[] = [
    {
      key: "name",
      header: "Document",
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3EDF2] text-[#714B67]">
            <FileSignature className="h-4 w-4" />
          </div>
          <span className="truncate font-medium">{d.name}</span>
        </div>
      ),
    },
    { key: "signer", header: "Signer", render: (d) => d.signer },
    { key: "requestedAt", header: "Requested", render: (d) => fmtDate(d.requestedAt) },
    { key: "signedAt", header: "Signed", hideSm: true, render: (d) => fmtDate(d.signedAt) },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    {
      key: "actions",
      header: "",
      render: (d) =>
        d.status === "to_sign" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              markSigned(d);
            }}
            aria-label={`Mark ${d.name} as signed`}
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark signed
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Sign"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search documents..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> Request signature
          </Button>
        }
      >
        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "cards")}>
          <TabsList className="h-8">
            <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
            <TabsTrigger value="cards" className="h-6 px-3 text-xs">Cards</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-3 md:px-6">
        <StatCard label="Awaiting signature" value={toSign} icon={<PenLine className="h-5 w-5" />} tone="amber" />
        <StatCard label="Signed" value={signed} icon={<ShieldCheck className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Completion rate" value={`${completionRate}%`} sub={`${items.length} documents total`} icon={<FileSignature className="h-5 w-5" />} tone="brand" />
      </div>

      {view === "list" ? (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(d) => setDrawer({ open: true, item: d })}
          loading={loading}
          emptyIcon={<FileSignature className="h-7 w-7" />}
          emptyTitle="No signature requests"
          emptyDescription="Send a document for electronic signature to get started."
        />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-7 w-7" />}
          title="No signature requests"
          description="Send a document for electronic signature to get started."
        />
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-6">
          {filtered.map((d) => (
            <article
              key={d.id}
              tabIndex={0}
              aria-label={`Open document ${d.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") setDrawer({ open: true, item: d });
              }}
              onClick={() => setDrawer({ open: true, item: d })}
              className="flex cursor-pointer flex-col rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F3EDF2] text-[#714B67]">
                  <FileSignature className="h-5 w-5" />
                </div>
                <StatusBadge status={d.status} />
              </div>
              <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-foreground">{d.name}</h3>
              <div className="mt-1 text-xs text-muted-foreground">
                Signer: <span className="font-medium text-foreground">{d.signer}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
                <span>Requested {fmtDate(d.requestedAt)}</span>
                {d.status === "to_sign" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      markSigned(d);
                    }}
                    aria-label={`Mark ${d.name} as signed`}
                  >
                    Mark signed
                  </Button>
                ) : (
                  <span>Signed {fmtDate(d.signedAt)}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.name}` : "New Signature Request"}
        description="Legally binding eSignatures, tracked end to end."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item } : null}
        onSubmit={handleSave}
        onDelete={drawer.item ? handleDelete : undefined}
      />
    </div>
  );
}
