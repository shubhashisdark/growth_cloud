"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSessionStore((state) => state.session);
  const hydrated = useAuthSessionStore((state) => state.hydrated);

  React.useEffect(() => {
    if (!hydrated) return;

    const isAuthPage =
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/verify-email") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/accept-invitation");

    const isAppPage =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/ai-assistant") ||
      pathname.startsWith("/analytics") ||
      pathname.startsWith("/campaigns") ||
      pathname.startsWith("/integrations") ||
      pathname.startsWith("/leads") ||
      pathname.startsWith("/scoring") ||
      pathname.startsWith("/segments") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/workflows");

    if (!session && isAppPage) {
      router.replace("/login");
      return;
    }

    if (session && isAuthPage && !pathname.startsWith("/accept-invitation")) {
      router.replace("/dashboard");
    }
  }, [hydrated, pathname, router, session]);

  if (!hydrated) {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <AuthRouteGuard>{children}</AuthRouteGuard>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}