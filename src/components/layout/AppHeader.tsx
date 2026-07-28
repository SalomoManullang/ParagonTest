"use client";

import { Landmark } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F1729] text-white">
            <Landmark size={16} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">
              VA Clearing
            </p>
            <p className="text-[11px] text-slate-400">
              Auto-reconciliation engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Simulation Clock widget slots in here during Step 5 */}
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}