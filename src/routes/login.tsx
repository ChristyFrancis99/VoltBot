import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Zap, AlertCircle, ShieldCheck } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import voltbotLogo from "@/assets/voltbot-logo.jpg";

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
    <div className="flex min-h-screen w-full flex-col justify-center bg-background py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <img
              src={voltbotLogo}
              alt="VoltBot Logo"
              className="size-14 shrink-0 rounded-2xl object-cover shadow-md"
            />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">VoltBot</h1>
              <p className="text-xs font-medium text-muted-foreground">Smart EV Battery Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-surface px-6 py-8 shadow-sm sm:rounded-2xl sm:px-10">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">Welcome Back</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to monitor real-time battery performance & health diagnostics
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-critical-soft p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="username" className="text-xs font-medium">
                Username or Email
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="mt-1.5 h-10 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Remember me
                </label>
              </div>

              <button
                type="button"
                onClick={() =>
                  alert("Demo credentials are Username: admin | Password: admin123")
                }
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full rounded-xl font-medium"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-muted/60 p-3.5 text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="size-4 text-primary" /> Demo Access Credentials
            </div>
            <p className="mt-1">
              Username: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">admin</code> &bull; Password: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
