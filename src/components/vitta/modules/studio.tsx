"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, Cpu, Database, Globe, KeyRound, LayoutGrid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { AppIcon } from "@/components/vitta/icons/app-icons";
import { APPS } from "@/lib/vitta/apps";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "vitta.studio.disabled";

function loadDisabledApps(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function StudioModule() {
  const [disabledIds, setDisabledIds] = useState<string[]>(loadDisabledApps);

  function toggleApp(id: string, checked: boolean) {
    const next = checked ? disabledIds.filter((x) => x !== id) : [...disabledIds, id];
    setDisabledIds(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
    toast.info("Visibility saved (applies to new sessions in this demo)");
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader title="Studio">
        <p className="text-xs text-muted-foreground">
          Customize your workspace — toggle app visibility and review your license. Changes apply to new sessions in this demo.
        </p>
      </PageHeader>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-3">
        {/* Apps */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="h-4 w-4 text-[#714B67]" /> Apps
            </CardTitle>
            <CardDescription>
              Show or hide apps in the launcher. {APPS.length - disabledIds.length} of {APPS.length} visible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {APPS.map((app) => {
                const enabled = !disabledIds.includes(app.id);
                return (
                  <div
                    key={app.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      !enabled && "bg-muted/40 opacity-60"
                    )}
                  >
                    <div className="h-9 w-9 shrink-0">
                      <AppIcon id={app.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{app.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{app.blurb}</div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(c) => toggleApp(app.id, c)}
                      aria-label={`Toggle ${app.name} visibility`}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* License */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4 text-[#714B67]" /> License
              </CardTitle>
              <CardDescription>VITTA Enterprise Edition</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoRow label="Edition" value="Enterprise" />
              <InfoRow label="Seats" value="25 named users" />
              <InfoRow label="Licensing" value="Node-locked" />
              <InfoRow label="Support until" value="Mar 2027" />
              <InfoRow label="Modules installed" value="24 / 40" />
              <div className="mt-3 rounded-lg bg-[#F3EDF2] p-3 text-xs text-[#714B67]">
                Proprietary software. Redistribution prohibited.
              </div>
            </CardContent>
          </Card>

          {/* System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-4 w-4 text-[#714B67]" /> System
              </CardTitle>
              <CardDescription>Runtime information for this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoRow label="Version" value="VITTA 3.1.0" />
              <InfoRow label="Database" value={<span className="inline-flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-muted-foreground" /> SQLite (Prisma)</span>} />
              <InfoRow label="Environment" value="Next.js 16" />
              <InfoRow label="Region" value={<span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-muted-foreground" /> Asia/Kolkata</span>} />
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-rose-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-rose-700">
                <AlertTriangle className="h-4 w-4" /> Danger zone
              </CardTitle>
              <CardDescription>Irreversible, destructive actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="h-9 w-full border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => toast.info("Workspace reset is disabled in this demo")}
              >
                Reset workspace (demo)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
