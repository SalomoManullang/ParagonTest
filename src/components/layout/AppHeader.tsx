"use client";

import { useAppState } from "@/context/AppStateContext";
import { Calendar } from "lucide-react";

export function AppHeader() {
  const { state, setSystemTime } = useAppState();

  // Ekstrak tanggal format YYYY-MM-DD dari systemTime ISO string
  const currentSystemDate = state.systemTime ? state.systemTime.split("T")[0] : "2026-08-01";

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-900 tracking-tight text-base">VA Clearing Engine</span>
      </div>

      {/* Controller Simulasi Tanggal Sistem */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
        <Calendar size={15} className="text-teal-700" />
        <span className="text-xs font-semibold text-slate-600">Tanggal Simulasi:</span>
        <input
          type="date"
          value={currentSystemDate}
          onChange={(e) => {
            if (e.target.value) {
              setSystemTime(new Date(e.target.value).toISOString());
            }
          }}
          className="text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
        />
      </div>
    </header>
  );
}