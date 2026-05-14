"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/BottomNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <BottomNav />
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "bg-bg-elev text-fg border border-border",
          },
        }}
      />
    </ThemeProvider>
  );
}