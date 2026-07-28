"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { Calendar, Loader2 } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";

const TODAY_DATE = new Date().toISOString().split("T")[0];

export function AppHeader() {
  const { state, setSystemTime } = useAppState();
  const [isLoading, setIsLoading] = useState(false);

  const currentSystemDate = state.systemTime ? state.systemTime.split("T")[0] : TODAY_DATE;

  function handleDateChange(newDate: string) {
    if (!newDate) return;

    setIsLoading(true);
    setTimeout(() => {
      setSystemTime(new Date(newDate).toISOString());
      setIsLoading(false);
    }, 400);
  }

  function handleResetToToday() {
    setIsLoading(true);
    setTimeout(() => {
      setSystemTime(new Date(TODAY_DATE).toISOString());
      setIsLoading(false);
    }, 400);
  }

  return (
    <header className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-6">
        <span className="font-bold text-slate-900 tracking-tight text-lg">VA Clearing Engine</span>
        {/* Role Switcher dikembalikan di sini */}
        <RoleSwitcher />
      </div>

      {/* Controller Simulasi Waktu dengan Tombol Teks "Default" */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs transition-all">
        <Calendar size={18} className="text-teal-700" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Simulasi Waktu Sistem</span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <input
              type="date"
              value={currentSystemDate}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={isLoading}
              className="text-sm font-mono font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            />
            {isLoading ? (
              <Loader2 size={15} className="animate-spin text-teal-600" />
            ) : (
              <button
                onClick={handleResetToToday}
                className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Default
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}