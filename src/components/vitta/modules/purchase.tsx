"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calculator,
  ClipboardList,
  IndianRupee,
  Loader2,
  PackageCheck,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { Kanban, type KanbanStage } from "@/components/vitta/ui/kanban";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { fmtMoney, fmtDate, toDateInput, todayISO } from "@/lib/vitta/format";
import LinesEditor, { type EditorLine } from "./lines-editor";
import type { PurchaseOrder, PurchaseStatus } from "@/lib/vitta/types";

const STAGES: KanbanStage[] = [
  { key: "rfq", label: "RFQ", dot: "bg-sky-500" },
  { key: "confirmed", label: "Purchase Order", dot: "bg-amber-500" },
  { key: "received", label: "Received", dot: "bg-emerald-500" },
  { key: "cancel", label: "Cancelled", dot: "bg-rose-500" },
];

const STATUS_OPTIONS = STAGES.map((s) => ({ value: s.key, label: s.label }));

export default function PurchaseModule() {
  const { items, loading, reload, create, update, remove } = useResource<PurchaseOrder>("purchases");
  const { items: vendors } = useResource<{ id: string; name: string }>("contacts", { type: "vendor" });

  const [view, setView] = useState<"list" | "board">("list");
  const [q, setQ] = useState("");

  const [form, setForm] = useState<{ open: boolean; item: PurchaseOrder | null }>({ open: false, item: null });
  const [vendorId, setVendorId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("rfq");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<EditorLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (o) =>
        o.number.toLowerCase().includes(needle) ||
        o.vendorName.toLowerCase().includes(needle)
    );
  }, [items, q]);

  const rfqOpen = items.filter((o) => o.status === "rfq").length;
  const awaiting = items.filter((o) => o.status === "confirmed").length;
  const receivedOrders = items.filter((o) => o.status === "received");
  const purchasedValue = receivedOrders.reduce((a, o) => a + o.total, 0);
  const poSet = items.filter((o) => o.status !== "cancel");
  const poValue = poSet.reduce((a, o) => a + o.total, 0);
  const avgPo = poSet.length ? poValue / poSet.length : 0;

  const linesTotal = useMemo(
    () => lines.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.price) || 0), 0),
    [lines]
  );

  function openForm(item: PurchaseOrder | null) {
    setForm({ open: true, item });
    setVendorId(item?.vendorId ?? "");
    setDate(item ? toDateInput(item.date) : toDateInput(todayISO()));
    setStatus(item?.status ?? "rfq");
    setNotes(item?.notes ?? "");
    setLines(
      item?.lines.length
        ? item.lines.map((l) => ({ description: l.description, qty: String(l.qty), price: String(l.price) }))
        : [{ description: "", qty: "1", price: "0" }]
    );
  }

  function closeForm() {
    setForm({ open: false, item: null });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) {
      toast.error("Vendor is required");
      return;
    }
    const cleanLines = lines
      .filter((l) => l.description.trim() || (Number(l.qty) || 0) * (Number(l.price) || 0) > 0)
      .map((l) => ({ description: l.description.trim(), qty: Number(l.qty) || 0, price: Number(l.price) || 0 }));
    const payload = {
      vendorId,
      date: date ? new Date(date).toISOString() : undefined,
      status: status as PurchaseStatus,
      notes: notes || null,
      lines: cleanLines,
    };
    try {
      setSaving(true);
      if (form.item) {
        await update(form.item.id, payload);
        toast.success("Purchase order updated");
      } else {
        await create(payload);
        toast.success("RFQ created");
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.item) return;
    try {
      setDeleting(true);
      await remove(form.item.id);
      toast.success("Purchase order deleted");
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function setStage(order: PurchaseOrder, next: string) {
    await update(order.id, { status: next as PurchaseStatus });
    toast.success(`Moved to ${STAGES.find((s) => s.key === next)?.label ?? next}`);
  }

  const columns: Column<PurchaseOrder>[] = [
    {
      key: "number",
      header: "Number",
      render: (o) => <span className="font-mono font-medium">{o.number}</span>,
    },
    {
      key: "vendorName",
      header: "Vendor",
      render: (o) => <span className="font-medium">{o.vendorName}</span>,
    },
    { key: "date", header: "Date", hideSm: true, render: (o) => fmtDate(o.date) },
    {
      key: "total",
      header: "Total",
      render: (o) => <span className="font-semibold">{fmtMoney(o.total)}</span>,
    },
    { key: "items", header: "Items", hideSm: true, render: (o) => `${o.lines.length} items` },
    { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Purchase"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search purchase orders..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => openForm(null)} className="h-9">
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
          label="RFQs open"
          value={rfqOpen}
          sub={`${items.length} total`}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Confirmed awaiting receipt"
          value={awaiting}
          icon={<PackageCheck className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Purchased value"
          value={fmtMoney(purchasedValue, true)}
          sub={`${receivedOrders.length} received`}
          icon={<IndianRupee className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Avg PO value"
          value={fmtMoney(avgPo, true)}
          icon={<Calculator className="h-5 w-5" />}
          tone="violet"
        />
      </div>

      {view === "list" ? (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(o) => openForm(o)}
          loading={loading}
          emptyIcon={<Search className="h-7 w-7" />}
          emptyTitle="No purchase orders found"
          emptyDescription="Create your first RFQ to start buying."
        />
      ) : (
        <Kanban
          stages={STAGES}
          items={filtered}
          getStage={(o) => o.status}
          renderCard={(o) => (
            <div className="cursor-pointer" onClick={() => openForm(o)}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold">{o.number}</span>
                <span className="shrink-0 text-sm font-semibold text-emerald-700">{fmtMoney(o.total)}</span>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{o.vendorName}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{o.lines.length} items</span>
                <span>{fmtDate(o.date)}</span>
              </div>
            </div>
          )}
          onStageChange={setStage}
          loading={loading}
        />
      )}

      <Sheet open={form.open} onOpenChange={(o) => !o && closeForm()}>
        <SheetContent side="right" className="scroll-slim flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{form.item ? `Edit — ${form.item.number}` : "New RFQ"}</SheetTitle>
            <SheetDescription>Confirm an RFQ to turn it into a purchase order.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <div className="grid flex-1 grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="po-vendor" className="mb-1.5 block text-xs">
                  Vendor<span className="ml-0.5 text-rose-500">*</span>
                </Label>
                <Select value={vendorId || undefined} onValueChange={setVendorId}>
                  <SelectTrigger id="po-vendor" className="w-full">
                    <SelectValue placeholder="Select a vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="po-date" className="mb-1.5 block text-xs">Date</Label>
                <Input id="po-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
              </div>
              <div>
                <Label htmlFor="po-status" className="mb-1.5 block text-xs">Status</Label>
                <Select value={status || undefined} onValueChange={setStatus}>
                  <SelectTrigger id="po-status" className="w-full">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="po-notes" className="mb-1.5 block text-xs">Notes</Label>
                <Textarea
                  id="po-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms, expected receipt date..."
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-xs">Products</Label>
                <LinesEditor lines={lines} onChange={setLines} />
              </div>
            </div>
            <SheetFooter className="flex-row items-center justify-between gap-2 border-t px-5 py-4">
              <div>
                <div className="text-[11px] text-muted-foreground">Total</div>
                <div className="text-base font-semibold tabular-nums">{fmtMoney(linesTotal)}</div>
              </div>
              <div className="flex items-center gap-2">
                {form.item ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                    Delete
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || deleting}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
