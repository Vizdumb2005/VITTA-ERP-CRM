"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CreditCard,
  Loader2,
  Minus,
  Percent,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  ShoppingBag,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/vitta/api";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { DataTable, type Column } from "@/components/vitta/ui/data-table";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { fmtMoney, fmtDateTime } from "@/lib/vitta/format";
import { cn } from "@/lib/utils";
import type { PosOrder, Product } from "@/lib/vitta/types";

const PALETTE = ["#714B67", "#00A88D", "#F8931D", "#31A3DD"];

const PAY_METHODS = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "upi", label: "UPI", icon: Smartphone },
] as const;

type PayMethod = (typeof PAY_METHODS)[number]["key"];

const PAY_LABELS: Record<string, string> = { cash: "Cash", card: "Card", upi: "UPI" };

interface CartLine {
  id: string;
  name: string;
  qty: number;
  price: number;
}

/** Deterministic category color from the brand palette. */
function catColor(category: string | null | undefined): string {
  const s = category ?? "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
}

export default function PosModule() {
  const { items: orders, loading: ordersLoading, reload } = useResource<PosOrder>("pos");
  const { items: products, loading: productsLoading, reload: reloadProducts } = useResource<Product>("products");

  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [charging, setCharging] = useState(false);

  const filteredProducts = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle) ||
        (p.category ?? "").toLowerCase().includes(needle)
    );
  }, [products, q]);

  const cartCount = cart.reduce((a, l) => a + l.qty, 0);
  const subtotal = cart.reduce((a, l) => a + l.qty * l.price, 0);
  const gst = subtotal * 0.18;
  const total = Math.round((subtotal + gst) * 100) / 100;

  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const todaySales = todayOrders.reduce((a, o) => a + o.total, 0);

  function addToCart(p: Product) {
    if (p.qty <= 0) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.id === p.id);
      if (existing) return prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: p.id, name: p.name, qty: 1, price: p.price }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l)));
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleCharge() {
    if (cart.length === 0 || charging) return;
    try {
      setCharging(true);
      const item = await api.create<PosOrder>("pos", {
        items: cart.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
        total,
        itemsCount: cartCount,
        paymentMethod: payMethod,
      });
      toast.success(`Order ${item.number} recorded`);
      setCart([]);
      setPayMethod("cash");
      await Promise.all([reload(), reloadProducts()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setCharging(false);
    }
  }

  const recentCols: Column<PosOrder>[] = [
    {
      key: "number",
      header: "Number",
      render: (o) => <span className="font-mono font-medium">{o.number}</span>,
    },
    { key: "createdAt", header: "Time", render: (o) => fmtDateTime(o.createdAt) },
    { key: "itemsCount", header: "Items", hideSm: true, render: (o) => `${o.itemsCount} items` },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (o) => <span>{PAY_LABELS[o.paymentMethod] ?? o.paymentMethod}</span>,
    },
    {
      key: "total",
      header: "Total",
      render: (o) => <span className="font-semibold">{fmtMoney(o.total)}</span>,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Point of Sale"
        itemCount={filteredProducts.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search products..."
        onRefresh={() => {
          reloadProducts();
          reload();
        }}
        loading={productsLoading || ordersLoading}
      />

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard
          label="Today's sales"
          value={fmtMoney(todaySales, true)}
          sub={`${todayOrders.length} orders today`}
          icon={<Wallet className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Today's transactions"
          value={todayOrders.length}
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Cart items"
          value={cartCount}
          sub={`${cart.length} lines`}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="GST rate"
          value="18%"
          icon={<Percent className="h-5 w-5" />}
          tone="violet"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EDF2] text-[#714B67]">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="mt-2 text-sm font-semibold">No products found</h3>
              <p className="max-w-sm text-xs text-muted-foreground">
                Try a different search or add products in the Inventory app.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  disabled={p.qty <= 0}
                  aria-label={`Add ${p.name} to cart`}
                  className="flex flex-col rounded-xl border border-t-2 bg-white p-3 text-left shadow-sm transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderTopColor: catColor(p.category) }}
                >
                  <span className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">{p.name}</span>
                  <span className="mt-1 text-[11px] capitalize text-muted-foreground">{p.category ?? "Uncategorized"}</span>
                  <span className="mt-auto pt-2 text-sm font-bold text-[#714B67]">{fmtMoney(p.price)}</span>
                  <span
                    className={cn(
                      "mt-2 w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      p.qty <= 0
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    )}
                  >
                    In stock: {p.qty}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="flex w-full shrink-0 flex-col border-t bg-white lg:sticky lg:top-4 lg:w-80 lg:self-start lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Current order</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
          </div>
          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <ShoppingCart className="h-8 w-8 text-stone-300" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs text-muted-foreground">Tap a product to start a new sale.</p>
            </div>
          ) : (
            <div className="scroll-slim max-h-[45vh] overflow-y-auto px-4 lg:max-h-[42vh]">
              {cart.map((l) => (
                <div key={l.id} className="flex items-start gap-2 border-b py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{fmtMoney(l.price)} each</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => changeQty(l.id, -1)}
                        disabled={l.qty <= 1}
                        aria-label={`Decrease quantity of ${l.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => changeQty(l.id, 1)}
                        aria-label={`Increase quantity of ${l.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-11 w-11 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => removeLine(l.id)}
                        aria-label={`Remove ${l.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums">{fmtMoney(l.qty * l.price)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3 border-t px-4 py-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{fmtMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GST 18%</span>
                <span className="font-medium tabular-nums">{fmtMoney(gst)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-base font-bold tabular-nums">{fmtMoney(total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Payment method">
              {PAY_METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPayMethod(m.key)}
                  aria-pressed={payMethod === m.key}
                  aria-label={`Pay by ${m.label}`}
                  className={cn(
                    "flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] font-medium transition-colors",
                    payMethod === m.key
                      ? "border-[#714B67] bg-[#F3EDF2] text-[#714B67]"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              ))}
            </div>
            <Button className="h-11 w-full" onClick={handleCharge} disabled={cart.length === 0 || charging}>
              {charging ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Charge {fmtMoney(total)}
            </Button>
          </div>
        </aside>
      </div>

      <div className="pb-6">
        <h2 className="px-4 pb-2 pt-4 text-sm font-semibold md:px-6">Recent sales</h2>
        <DataTable
          columns={recentCols}
          items={orders}
          loading={ordersLoading}
          emptyIcon={<Receipt className="h-7 w-7" />}
          emptyTitle="No sales yet"
          emptyDescription="Completed POS orders will appear here."
        />
      </div>
    </div>
  );
}
