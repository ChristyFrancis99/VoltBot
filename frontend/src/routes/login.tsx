import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import loginPage from "@/assets/login-page.png";
import logo from "@/assets/logo-head.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, authReady } = useBattery();
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [authReady, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const success = signIn(username, password);
      setLoading(false);
      if (success) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        setError("Invalid username or password. Demo credentials: admin / admin123");
      }
    }, 300);
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#f5f3f8]">
      <div className="grid h-full w-full overflow-hidden bg-card lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        {/* Left visual panel: wider than the sign-in panel */}
        <section className="relative hidden h-full min-w-0 overflow-hidden bg-[#e5ddf3] lg:block">
          <img
            src={loginPage}
            alt="VoltBot EV battery mechanic illustration"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </section>

        {/* Right sign-in panel: designed to fit a single desktop viewport */}
        <section className="flex h-full min-w-0 items-center justify-center overflow-hidden bg-white px-7 py-5 sm:px-10 lg:px-10 xl:px-14">
          <div className="w-full max-w-[390px]">
            <div className="mb-5">
              <div className="mb-3">
                <img src={logo} alt="VoltBot Logo" className="h-12 w-auto object-contain" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to access your EV battery monitoring dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-critical-soft p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="username" className="text-xs font-semibold">
                  Username or Email
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="mt-1.5 h-11 rounded-xl border-border bg-background px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-11 rounded-xl border-border bg-background px-3.5 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <label
                    htmlFor="remember"
                    className="cursor-pointer text-xs text-muted-foreground"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Demo credentials are Username: admin | Password: admin123")}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl font-semibold shadow-sm"
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">Demo access</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary-soft/40 p-3.5">
              <div className="flex items-start gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Demo Access Credentials</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Username:{" "}
                    <code className="rounded bg-white px-1.5 py-0.5 font-mono text-foreground">
                      admin
                    </code>
                    <span className="mx-1">•</span>
                    Password:{" "}
                    <code className="rounded bg-white px-1.5 py-0.5 font-mono text-foreground">
                      admin123
                    </code>
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-[10px] text-muted-foreground">
              VoltBot • Smart EV Battery Health & Early Fault Detection
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
