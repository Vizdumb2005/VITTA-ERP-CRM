"use client";

import { Grid3X3, Building2, ChevronRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVitta } from "@/lib/vitta/store";
import { getApp } from "@/lib/vitta/apps";
import { initials } from "@/lib/vitta/format";
import { CURRENT_USER } from "@/lib/vitta/types";
import { toast } from "sonner";

export function Topbar() {
  const activeApp = useVitta((s) => s.activeApp);
  const goHome = useVitta((s) => s.goHome);
  const app = getApp(activeApp);

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-1 bg-[#3A2738] px-2 text-white shadow-md md:gap-2 md:px-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-white hover:bg-white/10"
        onClick={goHome}
        aria-label="Home — open apps menu"
      >
        <Grid3X3 className="h-5 w-5" />
      </Button>

      <button
        onClick={goHome}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-white/10"
        aria-label="VITTA home"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded bg-white">
          <Building2 className="h-4 w-4 text-[#714B67]" />
        </span>
        <span className="hidden text-sm font-bold tracking-widest sm:block">VITTA</span>
      </button>

      {app ? (
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-0.5 text-sm">
          <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
          <span className="truncate px-1 font-medium">{app.name}</span>
        </nav>
      ) : (
        <span className="hidden truncate px-1 text-sm text-white/60 md:block">All apps</span>
      )}

      <span className="ml-1 hidden items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 lg:flex">
        <BadgeCheck className="h-3 w-3" /> Enterprise
      </span>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-white/10" aria-label="User menu">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-[#714B67] text-[11px] font-semibold text-white">
                  {initials(CURRENT_USER)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-xs font-medium md:block">{CURRENT_USER}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-semibold">{CURRENT_USER}</div>
              <div className="text-xs font-normal text-muted-foreground">Administrator</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("My Profile", { description: "Settings are managed by your administrator." })}>
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast.info("VITTA Enterprise Edition", {
                  description: "Proprietary software. © 2025 VITTA Labs. All rights reserved.",
                })
              }
            >
              License & Legal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Signed in as Administrator", { description: "Session persists for this demo." })}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
