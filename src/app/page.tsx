"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { BuyerDashboard } from "@/components/buyer/BuyerDashboard";
import { useAppState } from "@/context/AppStateContext";

export default function Home() {
  const { activeStore } = useAppState();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {activeStore.role === "buyer" ? (
          <BuyerDashboard storeId={activeStore.id} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-400">
              Seller / Platform Finance portal arrives in Step 4
            </p>
            <h1 className="mt-2 text-xl font-semibold text-slate-900">
              Viewing as {activeStore.name}
            </h1>
          </div>
        )}
      </main>
    </>
  );
}