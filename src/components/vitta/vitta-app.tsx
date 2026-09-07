"use client";

import { useEffect } from "react";
import { useVitta, bindHashNavigation } from "@/lib/vitta/store";
import { getApp } from "@/lib/vitta/apps";
import { Topbar } from "./topbar";
import { AppLauncher } from "./app-launcher";
import { MODULE_VIEWS } from "./module-views";
import { ErrorBoundary } from "./error-boundary";

export function VittaApp() {
  const activeApp = useVitta((s) => s.activeApp);

  // Browser back/forward support via #/app hash
  useEffect(() => bindHashNavigation(), []);

  // Reset scroll when switching apps
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeApp]);

  const View = activeApp ? MODULE_VIEWS[activeApp] : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F8]">
      <Topbar />
      <main className="flex flex-1 flex-col" aria-label={activeApp ? getApp(activeApp)?.name : "Apps home"}>
        {View ? (
          <ErrorBoundary key={activeApp} appName={getApp(activeApp)?.name ?? "App"}>
            <View />
          </ErrorBoundary>
        ) : (
          <AppLauncher />
        )}
      </main>
    </div>
  );
}
