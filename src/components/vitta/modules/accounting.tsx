"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileText, Loader2, Plus, Receipt, Trash2, TrendingUp } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDate, toDateInput } from "@/lib/vitta/format";
import type { Contact, Invoice } from "@/lib/vitta/types";

const INVOICE_STAGES: KanbanStage[] = [
  { key: "draft", label: "Draft", dot: "bg-stone-400" },
  { key: "posted", label: "Posted", dot: "bg-amber-500" },
  { key: "paid", label: "Paid", dot: "bg-emerald-500" },
];

interface LineDraft {
  description: string;
  qty: string;
  price: string;
}

type InvoicePayload = {
  type: "customer" | "vendor";
  contactId: string;
  date: string;
  dueDate: string | null;
  status: Invoice["status"];
  notes: string | null;
  lines: { description: string; qty: number; price: number }[];
}

function emptyLine(): LineDraft {
  return { description: "", qty: "1", price: "" };
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isOverdue(inv: Invoice, todayMs: number): boolean {
  return inv.status === "posted" && !!inv.dueDate && new Date(inv.dueDate).getTime() < todayMs;
}

/** Invoice create/edit drawer with a line-items editor (local to this module). */
function InvoiceSheet({
  open,
  onClose,
  initial,
  contacts,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  initial: Invoice | null;
  contacts: Contact[];
  onSubmit: (payload: InvoicePayload) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [type, setType] = useState<"customer" | "vendor">("customer");
  const [contactId, setContactId] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Invoice["status"]>("draft");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "customer");
    setContactId(initial?.contactId ?? "");
    setDate(toDateInput(initial?.date));
    setDueDate(toDateInput(initial?.dueDate));
    setStatus(initial?.status ?? "draft");
    setNotes(initial?.notes ?? "");
    setLines(
      initial?.lines?.length
        ? initial.lines.map((l) => ({ description: l.description, qty: String(l.qty), price: String(l.price) }))
        : [emptyLine()]
    );
  }, [open, initial]);

  const total = useMemo(
    () => lines.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.price) || 0), 0),
    [lines]
  );

  function setLine(idx: number, patch: Partial<LineDraft>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      toast.error("Invoice date is required");
      return;
    }
    if (!contactId) {
      toast.error("Partner is required");
      return;
    }
    const clean = lines.filter((l) => l.description.trim() || Number(l.qty) || Number(l.price));
    if (clean.length === 0) {
      toast.error("Add at least one line");
      return;
    }
    try {
      setSaving(true);
      await onSubmit({
        type,
        contactId,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        status,
        notes: notes || null,
        lines: clean.map((l) => ({
          description: l.description.trim(),
          qty: Number(l.qty) || 0,
          price: Number(l.price) || 0,
        })),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      setDeleting(true);
      await onDelete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="scroll-slim flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{initial ? `Edit — ${initial.number}` : "New Invoice"}</SheetTitle>
          <SheetDescription>Customer invoices and vendor bills with line items.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="grid flex-1 grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="inv-type" className="mb-1.5 block text-xs">
                Type<span className="ml-0.5 text-rose-500">*</span>
              </Label>
              <Select value={type} onValueChange={(v) => setType(v as "customer" | "vendor")}>
                <SelectTrigger id="inv-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer invoice</SelectItem>
                  <SelectItem value="vendor">Vendor bill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inv-contact" className="mb-1.5 block text-xs">
                Partner<span className="ml-0.5 text-rose-500">*</span>
              </Label>
              <Select value={contactId || undefined} onValueChange={setContactId}>
                <SelectTrigger id="inv-contact" className="w-full">
                  <SelectValue placeholder="Select partner..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inv-date" className="mb-1.5 block text-xs">
                Invoice date<span className="ml-0.5 text-rose-500">*</span>
              </Label>
              <Input id="inv-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="inv-due" className="mb-1.5 block text-xs">Due date</Label>
              <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="inv-status" className="mb-1.5 block text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Invoice["status"])}>
                <SelectTrigger id="inv-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="inv-notes" className="mb-1.5 block text-xs">Notes</Label>
              <Textarea
                id="inv-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, references..."
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs">Lines</Label>
              <div className="space-y-2">
                {lines.map((ln, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={ln.description}
                      onChange={(e) => setLine(idx, { description: e.target.value })}
                      placeholder="Description"
                      className="min-w-0 flex-1"
                      aria-label={`Line ${idx + 1} description`}
                    />
                    <Input
                      type="number"
                      value={ln.qty}
                      onChange={(e) => setLine(idx, { qty: e.target.value })}
                      placeholder="Qty"
                      className="w-16 shrink-0"
                      aria-label={`Line ${idx + 1} quantity`}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={ln.price}
                      onChange={(e) => setLine(idx, { price: e.target.value })}
                      placeholder="Price"
                      className="w-24 shrink-0"
                      aria-label={`Line ${idx + 1} price`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
                      aria-label={`Remove line ${idx + 1}`}
                      disabled={lines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setLines((ls) => [...ls, emptyLine()])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add line
              </Button>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-base font-semibold text-foreground">{fmtMoney(total)}</span>
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row items-center justify-between gap-2 border-t px-5 py-4">
            <div>
              {onDelete ? (
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
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
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
  );
}

export default function AccountingModule() {
  const { items, loading, reload, create, update, remove } = useResource<Invoice>("invoices");
  const { items: contacts } = useResource<Contact>("contacts");

  const [docType, setDocType] = useState<"customer" | "vendor">("customer");
  const [view, setView] = useState<"list" | "board">("list");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Invoice | null }>({ open: false, item: null });

  const todayMs = useMemo(() => startOfToday(), []);

  const byType = useMemo(() => items.filter((i) => i.type === docType), [items, docType]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return byType;
    return byType.filter(
      (i) => i.number.toLowerCase().includes(needle) || (i.contactName ?? "").toLowerCase().includes(needle)
    );
  }, [byType, q]);

  const customerInvoices = useMemo(() => items.filter((i) => i.type === "customer"), [items]);
  const paidRevenue = customerInvoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.total, 0);
  const openReceivables = customerInvoices.filter((i) => i.status === "posted").reduce((a, i) => a + i.total, 0);
  const overdueTotal = customerInvoices
    .filter((i) => isOverdue(i, todayMs))
    .reduce((a, i) => a + i.total, 0);
  const draftTotal = customerInvoices.filter((i) => i.status === "draft").reduce((a, i) => a + i.total, 0);

  async function handleInvoiceSave(payload: InvoicePayload) {
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Invoice updated");
    } else {
      await create(payload);
      toast.success("Invoice created");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleInvoiceDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("Invoice deleted");
    setDrawer({ open: false, item: null });
  }

  async function setStage(inv: Invoice, status: string) {
    await update(inv.id, { status: status as Invoice["status"] });
    if (status === "paid") toast.success("Payment registered");
    else if (status === "posted") toast.success("Invoice posted");
    else toast.success("Invoice moved to draft");
  }

  const columns: Column<Invoice>[] = [
    { key: "number", header: "Number", render: (i) => <span className="font-mono text-xs font-medium">{i.number}</span> },
    { key: "contactName", header: "Partner", render: (i) => <span className="font-medium">{i.contactName ?? "—"}</span> },
    { key: "date", header: "Date", render: (i) => fmtDate(i.date) },
    { key: "dueDate", header: "Due", hideSm: true, render: (i) => fmtDate(i.dueDate) },
    { key: "total", header: "Total", render: (i) => <span className="font-semibold">{fmtMoney(i.total)}</span> },
    { key: "status", header: "Status", render: (i) => <StatusBadge status={i.status} /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Accounting"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder={docType === "customer" ? "Search invoices..." : "Search bills..."}
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={docType}
            onValueChange={(v) => {
              setDocType(v as "customer" | "vendor");
              setQ("");
            }}
          >
            <TabsList className="h-8">
              <TabsTrigger value="customer" className="h-6 px-3 text-xs">Customer Invoices</TabsTrigger>
              <TabsTrigger value="vendor" className="h-6 px-3 text-xs">Vendor Bills</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "board")}>
            <TabsList className="h-8">
              <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
              <TabsTrigger value="board" className="h-6 px-3 text-xs">Board</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 md:px-6 xl:grid-cols-4">
        <StatCard label="Paid revenue" value={fmtMoney(paidRevenue)} icon={<TrendingUp className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Open receivables" value={fmtMoney(openReceivables)} icon={<Receipt className="h-5 w-5" />} tone="brand" />
        <StatCard label="Overdue" value={fmtMoney(overdueTotal)} sub="posted, past due date" icon={<AlertTriangle className="h-5 w-5" />} tone="rose" />
        <StatCard label="Draft total" value={fmtMoney(draftTotal)} icon={<FileText className="h-5 w-5" />} tone="violet" />
      </div>

      {view === "list" ? (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(i) => setDrawer({ open: true, item: i })}
          loading={loading}
          emptyIcon={<Receipt className="h-7 w-7" />}
          emptyTitle={docType === "customer" ? "No invoices found" : "No vendor bills found"}
          emptyDescription="Create your first document to start billing."
        />
      ) : (
        <Kanban
          stages={INVOICE_STAGES}
          items={filtered}
          getStage={(i) => i.status}
          renderCard={(i) => {
            const overdue = isOverdue(i, todayMs);
            return (
              <div className="cursor-pointer" onClick={() => setDrawer({ open: true, item: i })}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-muted-foreground">{i.number}</span>
                  <span className="shrink-0 text-sm font-semibold text-foreground">{fmtMoney(i.total)}</span>
                </div>
                <div className="mt-1 truncate text-sm font-medium">{i.contactName ?? "—"}</div>
                <div className={cn("mt-1 text-xs", overdue ? "font-medium text-rose-600" : "text-muted-foreground")}>
                  Due {fmtDate(i.dueDate)}
                </div>
              </div>
            );
          }}
          onStageChange={setStage}
          loading={loading}
        />
      )}

      <InvoiceSheet
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        initial={drawer.item}
        contacts={contacts}
        onSubmit={handleInvoiceSave}
        onDelete={drawer.item ? handleInvoiceDelete : undefined}
      />
    </div>
  );
}
