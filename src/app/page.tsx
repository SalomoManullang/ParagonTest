"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { BuyerDashboard } from "@/components/buyer/BuyerDashboard";
import { SellerDashboard } from "@/components/seller/SellerDashboard"; // Pastikan import ini ada
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
          <SellerDashboard />
        )}
      </main>
    </>
  );
}