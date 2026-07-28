import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppStateProvider } from "@/context/AppStateContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VA Clearing — B2B Invoice Auto-Clearing",
  description:
    "Virtual Account invoice auto-clearing prototype with Greedy Earliest-Due-First allocation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#F7F8FA] text-slate-900">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}