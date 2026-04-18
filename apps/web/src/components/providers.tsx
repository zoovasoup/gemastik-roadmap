"use client";

import { Toaster } from "@gemastik/ui/components/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { TRPCReactProvider, getQueryClient } from "@/utils/trpc";

import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TRPCReactProvider>
        <div className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
        <ReactQueryDevtools client={queryClient} />
      </TRPCReactProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
