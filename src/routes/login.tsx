import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Zap, AlertCircle, ShieldCheck, BatteryCharging, Activity } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import voltbotLogo from "@/assets/voltbot-logo.jpg";
import mechbot from "@/assets/mech-bot.png";

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
    <main className="min-h-screen bg-[#f5f3f8] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-[1280px] overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_60px_rgba(47,38,79,0.10)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.08fr_0.92fr]">
        {/* Left visual / product panel */}
        <section className="relative hidden min-h-[720px] overflow-hidden bg-gradient-to-br from-[#eee8fb] via-[#e4d9f5] to-[#d8c9ee] lg:block">
          <div className="absolute -left-20 -top-20 size-72 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute -bottom-24 -right-20 size-80 rounded-full bg-white/35 blur-3xl" />

          {/* subtle monitoring / circuit decoration */}
          <div className="absolute left-10 top-28 h-px w-44 bg-primary/20" />
          <div className="absolute left-10 top-28 size-2 rounded-full bg-primary/40" />
          <div className="absolute right-16 top-36 flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-3 py-1.5 text-[11px] font-medium text-primary shadow-sm backdrop-blur-sm">
            <Activity className="size-3.5" /> Live diagnostics
          </div>

          <div className="relative z-10 flex h-full flex-col px-10 py-10 xl:px-14 xl:py-12">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <img src={voltbotLogo} alt="VoltBot" className="size-full object-cover" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight text-[#29223d]">VoltBot</div>
                <div className="text-xs font-medium text-[#6f6385]">Smart EV Battery Monitoring</div>
              </div>
            </div>

            <div className="mt-10 max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/65 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm">
                <Zap className="size-3.5 fill-current" />
                Intelligent battery care
              </div>
              <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[#29223d] xl:text-4xl">
                Your EV battery's
                <span className="block text-primary">smart mechanic.</span>
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#6f6385]">
                Monitor battery health, understand abnormal behaviour, and catch early warning signs before they become bigger problems.
              </p>
            </div>

            {/* Mechanic robot visual */}
            <div className="relative mt-auto flex min-h-[390px] items-end justify-center">
              <div className="absolute bottom-10 h-28 w-72 rounded-full bg-primary/10 blur-2xl" />
              <img
                src={mechbot}
                alt="VoltBot mechanic robot"
                className="relative z-10 max-h-[470px] w-auto max-w-[86%] object-contain object-bottom drop-shadow-[0_22px_24px_rgba(59,42,104,0.18)]"
              />

              <div className="absolute bottom-14 left-4 rounded-2xl border border-white/70 bg-white/65 px-3.5 py-3 shadow-sm backdrop-blur-md xl:left-8">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <BatteryCharging className="size-4" />
                  </span>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Battery monitoring</p>
                    <p className="text-xs font-semibold text-foreground">Health & fault detection</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-28 right-2 rounded-2xl border border-white/70 bg-white/65 px-3.5 py-3 shadow-sm backdrop-blur-md xl:right-8">
                <p className="text-[10px] text-muted-foreground">System status</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <span className="size-2 rounded-full bg-success" />
                  Ready to monitor
                </div>
              </div>
            </div>

            <p className="mt-2 text-xs font-medium tracking-wide text-[#766b8b]">
              Monitor. Analyze. Detect. Protect.
            </p>
          </div>
        </section>

        {/* Right sign-in panel */}
        <section className="flex min-h-[720px] items-center justify-center bg-white px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center overflow-hidden rounded-xl bg-primary/10">
                  <img src={voltbotLogo} alt="VoltBot" className="size-full object-cover" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-foreground">VoltBot</h1>
                  <p className="text-xs font-medium text-muted-foreground">Smart EV Battery Monitoring</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Zap className="size-6 fill-current" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to access your EV battery monitoring dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-critical-soft p-3.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
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
                  className="mt-2 h-11 rounded-xl border-border bg-background px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                <div className="relative mt-2">
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
                  <label htmlFor="remember" className="cursor-pointer text-xs text-muted-foreground">
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

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">Demo access</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary-soft/40 p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Demo Access Credentials</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Username: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-foreground">admin</code>
                    <span className="mx-1">•</span>
                    Password: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-foreground">admin123</code>
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-[11px] text-muted-foreground">
              VoltBot • Smart EV Battery Health & Early Fault Detection
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
