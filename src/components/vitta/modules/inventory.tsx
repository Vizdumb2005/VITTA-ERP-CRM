"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Boxes, Package, PackageX, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatusBadge } from "@/components/vitta/ui/status-badge";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { fmtMoney } from "@/lib/vitta/format";
import type { Product } from "@/lib/vitta/types";

const STOCK_MAP: Record<string, { label: string; className: string }> = {
  out: { label: "Out of stock", className: "bg-rose-100 text-rose-700 border-rose-200" },
  low: { label: "Low", className: "bg-amber-100 text-amber-800 border-amber-200" },
  in: { label: "In stock", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

const TYPE_MAP: Record<string, { label: string; className: string }> = {
  goods: { label: "Goods", className: "bg-violet-100 text-violet-800 border-violet-200" },
  service: { label: "Service", className: "bg-teal-100 text-teal-800 border-teal-200" },
};

function stockKey(qty: number): "out" | "low" | "in" {
  if (qty <= 0) return "out";
  if (qty <= 10) return "low";
  return "in";
}

function stockTextClass(qty: number): string {
  if (qty <= 0) return "font-medium text-rose-600";
  if (qty <= 10) return "font-medium text-amber-600";
  return "font-medium text-emerald-700";
}

const FIELDS: FieldDef[] = [
  { name: "name", label: "Product name", type: "text", required: true, full: true, placeholder: "e.g. Steel Cabinet 4-Door" },
  { name: "sku", label: "SKU", type: "text", required: true, placeholder: "e.g. FUR-0092" },
  { name: "category", label: "Category", type: "text", placeholder: "e.g. Furniture" },
  {
    name: "type",
    label: "Type",
    type: "select",
    defaultValue: "goods",
    options: [
      { value: "goods", label: "Goods" },
      { value: "service", label: "Service" },
    ],
  },
  { name: "price", label: "Sales price (₹)", type: "number", step: "0.01" },
  { name: "cost", label: "Cost (₹)", type: "number", step: "0.01" },
  { name: "qty", label: "On hand", type: "number" },
  { name: "unit", label: "Unit", type: "text", placeholder: "e.g. Units" },
];

export default function InventoryModule() {
  const { items, loading, reload, create, update, remove } = useResource<Product>("products");

  const [view, setView] = useState<"list" | "grid">("list");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Product | null }>({ open: false, item: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle) ||
        (p.category ?? "").toLowerCase().includes(needle)
    );
  }, [items, q]);

  const stockValue = items.reduce((a, p) => a + p.qty * p.cost, 0);
  const lowCount = items.filter((p) => p.qty > 0 && p.qty <= 10).length;
  const outCount = items.filter((p) => p.qty === 0).length;

  async function handleSave(values: RecordValues) {
    const payload = {
      name: values.name,
      sku: values.sku,
      category: values.category || null,
      type: (values.type || "goods") as Product["type"],
      price: Number(values.price || 0),
      cost: Number(values.cost || 0),
      qty: Number(values.qty || 0),
      unit: values.unit || "Units",
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Product updated");
    } else {
      await create(payload);
      toast.success("Product created");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("Product deleted");
    setDrawer({ open: false, item: null });
  }

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{p.name}</div>
          <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
        </div>
      ),
    },
    { key: "category", header: "Category", hideSm: true, render: (p) => <span className="capitalize">{p.category ?? "—"}</span> },
    { key: "type", header: "Type", render: (p) => <StatusBadge status={p.type} map={TYPE_MAP} /> },
    { key: "price", header: "Price", render: (p) => <span className="font-medium">{fmtMoney(p.price)}</span> },
    { key: "cost", header: "Cost", hideMd: true, render: (p) => <span className="text-muted-foreground">{fmtMoney(p.cost)}</span> },
    {
      key: "qty",
      header: "On hand",
      render: (p) => (
        <span className={stockTextClass(p.qty)}>
          {p.qty} {p.unit}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={stockKey(p.qty)} map={STOCK_MAP} /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Inventory"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search products, SKUs..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "grid")}>
            <TabsList className="h-8">
              <TabsTrigger value="list" className="h-6 px-3 text-xs">List</TabsTrigger>
              <TabsTrigger value="grid" className="h-6 px-3 text-xs">Grid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 md:px-6 xl:grid-cols-4">
        <StatCard label="Total products" value={items.length} icon={<Package className="h-5 w-5" />} tone="brand" />
        <StatCard label="Stock value" value={fmtMoney(stockValue)} icon={<Boxes className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Low stock" value={lowCount} sub="10 units or fewer" icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
        <StatCard label="Out of stock" value={outCount} sub="needs restocking" icon={<PackageX className="h-5 w-5" />} tone="rose" />
      </div>

      {view === "list" ? (
        <DataTable
          columns={columns}
          items={filtered}
          onRowClick={(p) => setDrawer({ open: true, item: p })}
          loading={loading}
          emptyIcon={<Search className="h-7 w-7" />}
          emptyTitle="No products found"
          emptyDescription="Create your first product to start tracking stock."
        />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Create your first product to start tracking stock."
          icon={<Search className="h-7 w-7" />}
        />
      ) : (
        <div className="scroll-slim flex-1 overflow-auto p-4 md:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDrawer({ open: true, item: p })}
                className="rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium leading-snug">{p.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-foreground">{fmtMoney(p.price)}</span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">{p.sku}</div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={stockKey(p.qty)} map={STOCK_MAP} />
                  <span className="truncate text-[11px] capitalize text-muted-foreground">{p.category ?? ""}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.name}` : "New Product"}
        description="Storable goods and services you sell or purchase."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item } : null}
        onSubmit={handleSave}
        onDelete={drawer.item ? handleDelete : undefined}
      />
    </div>
  );
}
