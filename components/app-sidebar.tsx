"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Mail,
  Zap,
  Puzzle,
  BarChart3,
  Sparkles,
  Target,
  Plug,
  Settings,
  ChevronUp,
  UserRound,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/backend";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

function LogoMark() {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[13px] font-extrabold"
        style={{
          background: "linear-gradient(135deg, #38BDF8, #818CF8)",
          color: "#0B0F1A",
          fontFamily: "var(--font-geist-sans), sans-serif",
        }}
      >
        G
      </div>
    </div>
  );
}

const platformNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Campaigns", href: "/campaigns", icon: Mail },
  { title: "Workflows", href: "/workflows", icon: Zap },
  { title: "Segments", href: "/segments", icon: Puzzle },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];

const intelligenceNav = [
  { title: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { title: "Scoring", href: "/scoring", icon: Target },
];

const bottomNav = [
  { title: "Integrations", href: "/integrations", icon: Plug },
  { title: "Settings", href: "/settings", icon: Settings },
];

function NavLink({
  item,
  active,
}: {
  item: { title: string; href: string; icon: React.ElementType };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className={cn(
          "group/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-sm transition-colors",
          active
            ? "bg-[rgba(56,189,248,0.10)] text-[#38BDF8] font-medium"
            : "text-[#94A3B8] hover:bg-[#1E2538] hover:text-[#F1F5F9]"
        )}
      >
        <Link href={item.href} className="flex items-center gap-2.5">
          <Icon className={cn("w-[18px] h-[18px] shrink-0", active ? "opacity-100" : "opacity-70")} />
          <span className="truncate">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSessionStore((store) => store.session);
  const clearSession = useAuthSessionStore((store) => store.clearSession);
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [logoutPending, setLogoutPending] = useState(false);

  const displayUser = user ?? session?.user ?? null;
  const membership = displayUser?.memberships?.[0] ?? null;
  const workspaceName = workspace?.name ?? displayUser?.name ?? "Growth Cloud";
  const workspaceRole = membership?.role ?? displayUser?.status ?? "Member";
  const workspaceLabel = displayUser?.email ?? "Signed in account";
  const formattedRole = String(workspaceRole)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const initials = (displayUser?.name ?? "GC")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    if (!session?.accessToken || logoutPending) return;

    setLogoutPending(true);
    try {
      await logout(session.accessToken);
    } catch {
      // Local session clear is the required fallback when the backend logout request fails.
    } finally {
      clearSession();
      router.push("/login");
      router.refresh();
      setLogoutPending(false);
    }
  };

  return (
    <Sidebar
      className="w-[240px] border-r bg-[#111827]"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <SidebarHeader className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2.5 px-2">
          <LogoMark />
          <span
            className="text-lg font-bold tracking-[-0.01em] text-[#F1F5F9]"
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            Growth Cloud
          </span>
        </div>
        <div className="px-2 mt-6 mb-2">
          <div className="text-[13px] font-semibold text-[#F1F5F9] truncate">{workspaceName}</div>
          <div className="text-[11px] text-[#64748B] mt-0.5 truncate">{workspace?.slug ? `/${workspace.slug}` : "Workspace"}</div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {platformNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
            Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {intelligenceNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto px-2 pt-4">
          <SidebarMenu className="space-y-1">
            {bottomNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))}
              />
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 pt-2 mt-2">
        <div className="border-t border-white/[0.08] pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#1E2538] transition-colors",
                  pathname.startsWith("/settings/profile") && "bg-[rgba(56,189,248,0.08)]"
                )}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #38BDF8, #818CF8)",
                    color: "#0B0F1A",
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#F1F5F9] truncate">
                    {displayUser?.name ?? "Signed out"}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate">{formattedRole}</div>
                </div>
                <ChevronUp className="w-4 h-4 text-[#64748B] shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="right"
              sideOffset={8}
              className="w-56 bg-[#1A1F2E] border-white/[0.08]"
            >
              <div className="px-2 py-2 border-b border-white/[0.06] mb-1">
                <div className="text-[13px] font-semibold text-[#F1F5F9] truncate">
                  {displayUser?.name ?? "Signed out"}
                </div>
                <div className="text-[11px] text-[#64748B] truncate">{workspaceLabel}</div>
              </div>
              <DropdownMenuItem
                asChild
                className="text-[#F1F5F9] focus:bg-[#1E2538] focus:text-[#F1F5F9] cursor-pointer"
              >
                <Link href="/settings/profile" className="flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-[#38BDF8]" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="text-[#F1F5F9] focus:bg-[#1E2538] focus:text-[#F1F5F9] cursor-pointer"
              >
                <Link href="/settings" className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#94A3B8]" />
                  Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={logoutPending}
                className="text-[#F87171] focus:bg-[#1E2538] focus:text-[#F87171] cursor-pointer"
                onClick={() => {
                  void handleLogout();
                }}
              >
                <LogOut className="w-4 h-4" />
                {logoutPending ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarInner />
      <SidebarInset className="bg-[#070A14]">{children}</SidebarInset>
    </SidebarProvider>
  );
}
