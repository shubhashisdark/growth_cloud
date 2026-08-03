import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppSidebar>{children}</AppSidebar>;
}
