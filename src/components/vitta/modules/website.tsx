"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Boxes,
  Building2,
  Calculator,
  Check,
  Factory,
  Globe,
  Lock,
  ShoppingCart,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { cn } from "@/lib/utils";

type PageKey = "home" | "features" | "pricing" | "about" | "contact";

const PAGES: { key: PageKey; label: string; heading: string; sub: string; anchor?: string }[] = [
  {
    key: "home",
    label: "Home",
    heading: "Run your entire business on VITTA",
    sub: "One proprietary ERP suite for accounting, sales, inventory, HR and more — beautifully integrated.",
  },
  {
    key: "features",
    label: "Features",
    heading: "Every app your team needs, in one suite",
    sub: "24 integrated applications sharing a single database. Switch on what you need, when you need it.",
    anchor: "site-features",
  },
  {
    key: "pricing",
    label: "Pricing",
    heading: "Simple, transparent pricing",
    sub: "Per-company licensing with every app included. No per-user surprises, ever.",
    anchor: "site-pricing",
  },
  {
    key: "about",
    label: "About",
    heading: "Crafted by VITTA Labs",
    sub: "We build enterprise software with the polish of consumer products. Proprietary, secure, yours.",
  },
  {
    key: "contact",
    label: "Contact",
    heading: "Talk to our team",
    sub: "Book a guided demo and see VITTA in action in under 30 minutes.",
    anchor: "site-contact",
  },
];

const FEATURES = [
  { icon: Users, title: "CRM", copy: "Track leads and close deals with a visual pipeline." },
  { icon: Calculator, title: "Accounting", copy: "Invoices, payments and real-time financial reports." },
  { icon: Boxes, title: "Inventory", copy: "Stock, warehouses and automated replenishment." },
  { icon: UserCog, title: "HR", copy: "Employees, time off and appraisals in one place." },
  { icon: Factory, title: "Manufacturing", copy: "MRP, shop floor and quality control built in." },
  { icon: ShoppingCart, title: "eCommerce", copy: "A modern storefront synced with your backend." },
];

const BAR_HEIGHTS = [40, 65, 50, 80, 60, 90];

const PLANS = [
  {
    name: "Starter",
    price: "₹24,000",
    period: "/mo",
    blurb: "For small teams getting started",
    features: ["All core apps", "Up to 5 users", "Email support"],
    cta: "Choose Starter",
    popular: false,
  },
  {
    name: "Gold",
    price: "₹98,000",
    period: "/mo",
    blurb: "For growing companies that need it all",
    features: ["All 24 apps", "Up to 25 users", "Priority support", "Studio customization"],
    cta: "Choose Gold",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    blurb: "Dedicated infrastructure and SLAs",
    features: ["Unlimited users", "On-premise option", "Dedicated success manager"],
    cta: "Contact sales",
    popular: false,
  },
];

export default function WebsiteModule() {
  const [page, setPage] = useState<PageKey>("home");
  const active = PAGES.find((p) => p.key === page) ?? PAGES[0];

  function selectPage(p: (typeof PAGES)[number]) {
    setPage(p.key);
    if (p.anchor) {
      window.setTimeout(() => {
        document.getElementById(p.anchor!)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Website"
        actions={
          <Button
            onClick={() => toast.success("Website published (demo)")}
            className="h-9"
          >
            <Globe className="mr-1 h-4 w-4" /> Publish
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {PAGES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => selectPage(p)}
              aria-pressed={page === p.key}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-3.5 text-xs font-medium transition-colors",
                page === p.key
                  ? "border-[#714B67] bg-[#714B67] text-white"
                  : "border-border bg-white text-muted-foreground hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
          <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
            Preview only — changes to hero copy per page
          </span>
        </div>
      </PageHeader>

      <div className="flex-1 p-4 md:p-6">
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="mx-auto flex items-center gap-1.5 rounded-md border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> vitta.example.com
            </div>
            <div className="w-10" />
          </div>

          {/* Site nav */}
          <nav className="flex items-center gap-4 border-b px-5 py-3 md:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#714B67] text-white">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">VITTA</span>
            </div>
            <div className="ml-4 hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
              {(["home", "features", "pricing"] as PageKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => selectPage(PAGES.find((p) => p.key === k)!)}
                  className="transition-colors hover:text-foreground"
                >
                  {PAGES.find((p) => p.key === k)!.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => selectPage(PAGES[4])}
                className="transition-colors hover:text-foreground"
              >
                Contact
              </button>
            </div>
            <Button size="sm" className="ml-auto h-8 bg-[#714B67] text-xs hover:bg-[#5d3d54]">
              Free demo
            </Button>
          </nav>

          {/* Hero */}
          <section className="grid grid-cols-1 items-center gap-8 px-5 py-10 md:px-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">{active.heading}</h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">{active.sub}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button className="h-9 bg-[#714B67] hover:bg-[#5d3d54]">
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Button variant="outline" className="h-9" onClick={() => selectPage(PAGES[2])}>
                  View pricing
                </Button>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Company dashboard</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Revenue", value: "₹4.2L" },
                  { label: "Orders", value: "1,284" },
                  { label: "Active users", value: "312" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-muted/50 p-2.5">
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    <div className="text-sm font-bold text-foreground">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex h-24 items-end gap-1.5">
                {BAR_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className={cn("flex-1 rounded-t", i % 2 === 0 ? "bg-[#714B67]" : "bg-teal-500")}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="site-features" className="border-t px-5 py-10 md:px-8">
            <h3 className="text-xl font-bold tracking-tight text-foreground">Everything, integrated</h3>
            <p className="mt-1 text-sm text-muted-foreground">Six of the 24 apps included in every plan.</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3EDF2] text-[#714B67]">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-foreground">{f.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.copy}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="site-pricing" className="border-t bg-muted/40 px-5 py-10 md:px-8">
            <h3 className="text-xl font-bold tracking-tight text-foreground">Pricing for every stage</h3>
            <p className="mt-1 text-sm text-muted-foreground">One license, the whole suite, your whole company.</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative rounded-xl border bg-white p-5 shadow-sm",
                    plan.popular && "ring-2 ring-[#714B67]"
                  )}
                >
                  {plan.popular ? (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-[#714B67] px-2 py-0.5 text-[10px] font-semibold text-white">
                      Most popular
                    </span>
                  ) : null}
                  <div className="text-sm font-semibold text-foreground">{plan.name}</div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.blurb}</p>
                  <ul className="mt-4 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-[#00A88D]" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className={cn("mt-5 h-9 w-full text-xs", plan.popular && "bg-[#714B67] hover:bg-[#5d3d54]")}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* CTA band */}
          <section id="site-contact" className="bg-[#714B67] px-5 py-10 text-center text-white md:px-8">
            <h3 className="text-xl font-bold tracking-tight">Ready to run your business on VITTA?</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/80">
              Join hundreds of companies that switched to a single, integrated suite.
            </p>
            <Button className="mt-5 h-9 bg-white text-[#714B67] hover:bg-white/90">Book a free demo</Button>
          </section>

          {/* Footer */}
          <footer className="border-t px-5 py-4 text-center text-xs text-muted-foreground md:px-8">
            © 2025 VITTA Labs — Proprietary software. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}
