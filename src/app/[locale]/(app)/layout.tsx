import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { SideNav } from "@/components/side-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh overflow-x-clip">
      {/* Desktop: fixed left sidebar. Mobile: hidden. */}
      <SideNav />

      <div className="md:pl-64">
        {/* Mobile-only top bar; desktop nav lives in the sidebar. */}
        <AppHeader />
        {/* pb-20 clears the fixed mobile bottom nav; not needed on desktop. */}
        <main className="pb-20 md:pb-10">{children}</main>
      </div>

      {/* Mobile: fixed bottom tab bar. Desktop: hidden. */}
      <BottomNav />
    </div>
  );
}
