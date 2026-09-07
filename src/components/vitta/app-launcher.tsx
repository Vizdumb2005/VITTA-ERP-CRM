"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { APPS } from "@/lib/vitta/apps";
import { useVitta } from "@/lib/vitta/store";
import { AppIcon } from "@/components/vitta/icons/app-icons";

export function AppLauncher() {
  const [q, setQ] = useState("");
  const openApp = useVitta((s) => s.openApp);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return APPS;
    return APPS.filter(
      (a) => a.name.toLowerCase().includes(needle) || a.blurb.toLowerCase().includes(needle)
    );
  }, [q]);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{greeting}, Aarav</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose an app to get things done.{" "}
              <span className="font-medium text-[#714B67]">VITTA Enterprise</span> — 24 apps installed.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search apps..."
              className="h-10 bg-white pl-8 shadow-sm"
              aria-label="Search apps"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 md:gap-6">
          {filtered.map((app) => (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              className="group flex flex-col items-center gap-2 rounded-xl p-2 transition-all hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#714B67]"
              aria-label={`Open ${app.name}`}
            >
              <div className="h-14 w-14 rounded-xl border border-black/5 bg-white shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-active:translate-y-0 sm:h-16 sm:w-16 md:h-[72px] md:w-[72px]">
                <AppIcon id={app.id} />
              </div>
              <div className="min-w-0 text-center">
                <div className="truncate text-xs font-semibold text-foreground sm:text-[13px]">{app.name}</div>
                <div className="hidden truncate text-[11px] text-muted-foreground sm:block">{app.blurb}</div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">No apps match “{q}”.</p>
        )}
      </div>

      <footer className="mt-auto border-t bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-muted-foreground md:px-8">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            VITTA ERP — proprietary software. © 2025 VITTA Labs Pvt. Ltd. All rights reserved.
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00A88D]" />
            Enterprise Edition · Node-locked license · Unauthorized copying prohibited
          </span>
        </div>
      </footer>
    </div>
  );
}
