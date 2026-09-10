import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/battery/Sidebar";
import { TopHeader } from "@/components/battery/TopHeader";
import { useBattery } from "@/lib/battery/store";

export const Route = createFileRoute("/_shell")({
  ssr: false,
  component: ShellLayout,
});

function ShellLayout() {
  const { user, authReady } = useBattery();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (authReady && !user) navigate({ to: "/login", replace: true });
  }, [authReady, user, navigate]);

  if (!authReady || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading monitoring session…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar />
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 h-full">
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">
        <TopHeader onOpenNav={() => setNavOpen(true)} />
        <Outlet />
        <p className="mt-6 pb-2 text-center text-[11px] text-muted-foreground">
          VoltBot operates as an additional monitoring and early-warning layer alongside the
          existing BMS. Values shown are demo data.
        </p>
      </main>
    </div>
  );
}
