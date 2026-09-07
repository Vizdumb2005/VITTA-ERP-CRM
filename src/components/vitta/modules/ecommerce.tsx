"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Package, Plus, Search, Store, Tag, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney } from "@/lib/vitta/format";
import type { Product } from "@/lib/vitta/types";
import { cn } from "@/lib/utils";

const PALETTE = ["#714B67", "#00A88D", "#F8931D", "#31A3DD"];

function categoryColor(category?: string | null): string {
  const sum = (category ?? "").split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

function StockChip({ product }: { product: Product }) {
  if (product.type === "service") {
    return (
      <span className="inline-flex items-center rounded-full border border-[#714B67]/20 bg-[#F3EDF2] px-2 py-0.5 text-[11px] font-medium text-[#714B67]">
        Service
      </span>
    );
  }
  if (product.qty === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
        <TriangleAlert className="h-3 w-3" /> Out of stock
      </span>
    );
  }
  if (product.qty <= 10) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
        Low stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      In stock
    </span>
  );
}

export default function EcommerceModule() {
  const { items, loading, reload, create, update } = useResource<Product>("products");
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Product | null }>({ open: false, item: null });

  const categories = useMemo(
    () => Array.from(new Set(items.map((p) => p.category).filter(Boolean))).sort() as string[],
    [items]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((p) => {
      if (category !== "All" && (p.category ?? "Uncategorized") !== category) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle) ||
        (p.category ?? "").toLowerCase().includes(needle)
      );
    });
  }, [items, category, q]);

  const outOfStock = items.filter((p) => p.type === "goods" && p.qty === 0).length;
  const avgPrice = items.length ? items.reduce((a, p) => a + p.price, 0) / items.length : 0;

  const FIELDS: FieldDef[] = [
    { name: "name", label: "Product name", type: "text", required: true, full: true, placeholder: "e.g. Bamboo desk organizer" },
    { name: "sku", label: "SKU", type: "text", required: true, placeholder: "e.g. DESK-ORG-001" },
    { name: "category", label: "Category", type: "text", placeholder: "e.g. Furniture" },
    { name: "price", label: "Sales price (₹)", type: "number", step: "0.01", required: true },
    { name: "qty", label: "Quantity", type: "number", defaultValue: "0" },
    { name: "type", label: "Type", type: "select", defaultValue: "goods", options: [
      { value: "goods", label: "Goods" },
      { value: "service", label: "Service" },
    ]},
  ];

  async function handleSave(values: RecordValues) {
    const payload = {
      name: values.name,
      sku: values.sku,
      category: values.category || null,
      price: Number(values.price || 0),
      qty: Number(values.qty || 0),
      type: (values.type || "goods") as Product["type"],
      cost: 0,
      unit: "Units",
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Product updated");
    } else {
      await create(payload);
      toast.success("Product published to store");
    }
    setDrawer({ open: false, item: null });
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="eCommerce"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search products..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> Add product
          </Button>
        }
      >
        <Tabs defaultValue="storefront">
          <TabsList className="h-8">
            <TabsTrigger value="storefront" className="h-6 px-3 text-xs">Storefront preview</TabsTrigger>
            <TabsTrigger value="orders" className="h-6 px-3 text-xs" disabled>Orders</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="px-4 pt-4 md:px-6">
        <div className="rounded-xl bg-gradient-to-r from-[#714B67] to-[#4C3247] p-8 text-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">VITTA Store</h2>
            <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium">
              Powered by VITTA eCommerce
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-white/80">
            Everything you sell, beautifully presented. Stock, pricing and orders stay in sync with your backend.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard label="Products" value={items.length} icon={<Package className="h-5 w-5" />} tone="brand" />
        <StatCard label="Out of stock" value={outOfStock} icon={<TriangleAlert className="h-5 w-5" />} tone="rose" />
        <StatCard label="Average price" value={fmtMoney(avgPrice)} icon={<Tag className="h-5 w-5" />} tone="teal" />
        <StatCard label="Categories" value={categories.length} icon={<Store className="h-5 w-5" />} tone="sky" />
      </div>

      <div className="scroll-slim flex items-center gap-2 overflow-x-auto px-4 pt-4 md:px-6">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition-colors",
              category === c
                ? "border-[#714B67] bg-[#714B67] text-white"
                : "border-border bg-white text-muted-foreground hover:bg-muted"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title="No products found"
          description="Try another category or search term, or add a new product."
          action={
            <Button onClick={() => setDrawer({ open: true, item: null })} size="sm" className="h-9">
              <Plus className="mr-1 h-4 w-4" /> Add product
            </Button>
          }
        />
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-6">
          {filtered.map((p) => (
            <article
              key={p.id}
              tabIndex={0}
              aria-label={`Open product ${p.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") setDrawer({ open: true, item: p });
              }}
              onClick={() => setDrawer({ open: true, item: p })}
              className="flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: categoryColor(p.category) }} />
              <div className="flex flex-1 flex-col p-4">
                <h3 className="truncate font-semibold text-foreground">{p.name}</h3>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {p.category ?? "Uncategorized"} · {p.sku}
                </div>
                <div className="mt-2 flex flex-1 items-end justify-between gap-2">
                  <span className="text-base font-bold text-foreground">{fmtMoney(p.price)}</span>
                  <StockChip product={p} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.name}` : "New Product"}
        description="Products sync instantly with the storefront preview."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item } : null}
        onSubmit={handleSave}
      />
    </div>
  );
}
