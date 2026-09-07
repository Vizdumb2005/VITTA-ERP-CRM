"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calculator,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Truck,
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
import type { SaleOrder, SaleStatus } from "@/lib/vitta/types";

const STAGES: KanbanStage[] = [
  { key: "quotation", label: "Quotation", dot: "bg-sky-500" },
  { key: "sent", label: "Quotation Sent", dot: "bg-violet-500" },
  { key: "sale", label: "Sales Order", dot: "bg-amber-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
  { key: "cancel", label: "Cancelled", dot: "bg-rose-500" },
];

const STATUS_OPTIONS = STAGES.map((s) => ({ value: s.key, label: s.label }));

export default function SalesModule() {
  const { items, loading, reload, create, update, remove } = useResource<SaleOrder>("sales");
  const { items: customers } = useResource<{ id: string; name: string }>("contacts", { type: "customer" });

  const [view, setView] = useState<"list" | "board">("list");
  const [q, setQ] = useState("");

  const [form, setForm] = useState<{ open: boolean; item: SaleOrder | null }>({ open: false, item: null });
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("quotation");
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
        o.customerName.toLowerCase().includes(needle)
    );
  }, [items, q]);

  const openQuotes = items.filter((o) => o.status === "quotation" || o.status === "sent").length;
  const toDeliver = items.filter((o) => o.status === "sale").length;
  const bookedOrders = items.filter((o) => o.status === "sale" || o.status === "done");
  const bookedRevenue = bookedOrders.reduce((a, o) => a + o.total, 0);
  const avgOrder = bookedOrders.length ? bookedRevenue / bookedOrders.length : 0;

  const linesTotal = useMemo(
    () => lines.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.price) || 0), 0),
    [lines]
  );

  function openForm(item: SaleOrder | null) {
    setForm({ open: true, item });
    setCustomerId(item?.customerId ?? "");
    setDate(item ? toDateInput(item.date) : toDateInput(todayISO()));
    setStatus(item?.status ?? "quotation");
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
    if (!customerId) {
      toast.error("Customer is required");
      return;
    }
    const cleanLines = lines
      .filter((l) => l.description.trim() || (Number(l.qty) || 0) * (Number(l.price) || 0) > 0)
      .map((l) => ({ description: l.description.trim(), qty: Number(l.qty) || 0, price: Number(l.price) || 0 }));
    const payload = {
      customerId,
      date: date ? new Date(date).toISOString() : undefined,
      status: status as SaleStatus,
      notes: notes || null,
      lines: cleanLines,
    };
    try {
      setSaving(true);
      if (form.item) {
        await update(form.item.id, payload);
        toast.success("Order updated");
      } else {
        await create(payload);
        toast.success("Quotation created");
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
      toast.success("Order deleted");
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function setStage(order: SaleOrder, next: string) {
    await update(order.id, { status: next as SaleStatus });
    toast.success(`Moved to ${STAGES.find((s) => s.key === next)?.label ?? next}`);
  }

  const columns: Column<SaleOrder>[] = [
    {
      key: "number",
      header: "Number",
      render: (o) => <span className="font-mono font-medium">{o.number}</span>,
    },
    {
      key: "customerName",
      header: "Customer",
      render: (o) => <span className="font-medium">{o.customerName}</span>,
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
        title="Sales"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search orders..."
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
          label="Open quotations"
          value={openQuotes}
          sub={`${items.length} total orders`}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Orders to deliver"
          value={toDeliver}
          icon={<Truck className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Booked revenue"
          value={fmtMoney(bookedRevenue, true)}
          sub={`${bookedOrders.length} confirmed`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Avg order value"
          value={fmtMoney(avgOrder, true)}
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
          emptyTitle="No orders found"
          emptyDescription="Create your first quotation to start selling."
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
              <div className="mt-1 truncate text-xs text-muted-foreground">{o.customerName}</div>
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
            <SheetTitle>{form.item ? `Edit — ${form.item.number}` : "New Quotation"}</SheetTitle>
            <SheetDescription>Confirm a quotation to turn it into a sales order.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <div className="grid flex-1 grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="so-customer" className="mb-1.5 block text-xs">
                  Customer<span className="ml-0.5 text-rose-500">*</span>
                </Label>
                <Select value={customerId || undefined} onValueChange={setCustomerId}>
                  <SelectTrigger id="so-customer" className="w-full">
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="so-date" className="mb-1.5 block text-xs">Date</Label>
                <Input id="so-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
              </div>
              <div>
                <Label htmlFor="so-status" className="mb-1.5 block text-xs">Status</Label>
                <Select value={status || undefined} onValueChange={setStatus}>
                  <SelectTrigger id="so-status" className="w-full">
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
                <Label htmlFor="so-notes" className="mb-1.5 block text-xs">Notes</Label>
                <Textarea
                  id="so-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms, delivery instructions..."
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
