"use client";

import { ChevronDown, Store as StoreIcon, Building2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAppState } from "@/context/AppStateContext";

export function RoleSwitcher() {
  const { state, activeStore, setActiveStoreId } = useAppState();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:border-slate-300 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {activeStore.role === "seller" ? (
          <Building2 size={16} className="text-teal-700" />
        ) : (
          <StoreIcon size={16} className="text-teal-700" />
        )}
        <span>{activeStore.name}</span>
        <span className="text-xs text-slate-400 font-mono">
          {activeStore.id}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {state.stores.map((store) => (
            <button
              key={store.id}
              role="option"
              aria-selected={store.id === activeStore.id}
              onClick={() => {
                setActiveStoreId(store.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                store.id === activeStore.id
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-700"
              }`}
            >
              {store.role === "seller" ? (
                <Building2 size={15} />
              ) : (
                <StoreIcon size={15} />
              )}
              <span className="flex-1">{store.name}</span>
              <span className="text-xs text-slate-400 font-mono">
                {store.id}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}