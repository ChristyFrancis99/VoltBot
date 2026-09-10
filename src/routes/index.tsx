import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useBattery } from "@/lib/battery/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, authReady } = useBattery();
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady) {
      if (user) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        navigate({ to: "/login", replace: true });
      }
    }
  }, [authReady, user, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
