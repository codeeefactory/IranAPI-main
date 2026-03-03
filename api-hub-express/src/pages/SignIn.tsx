import { AlertTriangle, ArrowLeft, KeyRound, LayoutDashboard, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { SocialAuthPanel } from "@/components/SocialAuthPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useSession } from "@/hooks/useApi";
import { getErrorMessage } from "@/lib/api";
import { usePageMetadata } from "@/lib/metadata";

const demoCredentials = {
  username: "demo-dev",
  password: "StrongPass123!",
};

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSession();
  const login = useLogin();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [formError, setFormError] = useState("");

  usePageMetadata({
    title: "ورود",
    description: "وارد حساب IranAPI شوید و داشبورد، دسترسی‌ها و گزارش مصرف خود را مدیریت کنید.",
    path: "/signin",
    noindex: true,
  });

  useEffect(() => {
    if (session.data?.authenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, session.data?.authenticated]);

  const nextPath = useMemo(() => (location.state as { from?: string } | null)?.from || "/dashboard", [location.state]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    try {
      await login.mutateAsync(formData);
      navigate(nextPath, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "ورود انجام نشد. نام کاربری یا رمز عبور را بررسی کنید."));
    }
  };

  const fillDemoAccount = () => {
    setFormData(demoCredentials);
    setFormError("");
  };

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="page-hero grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-start">
          <Card className="surface-card">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">ورود امن</Badge>
                <Badge variant="outline">Account Access</Badge>
              </div>
              <div className="space-y-3">
                <p className="eyebrow">حساب توسعه‌دهنده</p>
                <CardTitle className="text-3xl">ورود به حساب IranAPI</CardTitle>
                <p className="text-sm leading-7 text-muted-foreground">
                  از این حساب برای مدیریت پروفایل، دسترسی‌های ثبت‌شده، کلیدهای امن و تاریخچه مصرف استفاده می‌کنید.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {nextPath !== "/dashboard" ? (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">
                  برای ادامه، ابتدا وارد حساب خود شوید. بعد از ورود به صفحه قبلی برمی‌گردید.
                </div>
              ) : null}

              <SocialAuthPanel mode="signin" />

              {formError ? (
                <div className="flex items-start gap-3 rounded-md border border-destructive/35 bg-destructive/10 p-4 text-sm leading-7 text-destructive" role="alert">
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              ) : null}

              <form className="space-y-4 rounded-md border border-border/70 bg-background/45 p-4 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.07)]" onSubmit={handleSubmit} aria-busy={login.isPending}>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-black uppercase tracking-[0.22em] text-primary">ورود امن</span>
                  <span>نشست محافظت‌شده</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">نام کاربری</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={(event) => {
                      setFormError("");
                      setFormData((current) => ({ ...current, username: event.target.value }));
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">رمز عبور</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(event) => {
                      setFormError("");
                      setFormData((current) => ({ ...current, password: event.target.value }));
                    }}
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full gap-2" disabled={login.isPending}>
                  <ArrowLeft className="h-4 w-4" />
                  {login.isPending ? "در حال ورود..." : "ورود به داشبورد"}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground">
                حساب ندارید؟{" "}
                <Link to="/signup" className="font-medium text-primary">
                  ساخت حساب
                </Link>
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="surface-card">
              <CardContent className="content-list p-6 text-sm leading-7 text-muted-foreground">
                <div className="metric-card">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    داشبورد آماده مدیریت
                  </p>
                  <p>پس از ورود می‌توانید پروفایل، مصرف، دسترسی‌های فعال و اشتراک‌ها را در یک نگاه بررسی کنید.</p>
                </div>
                <div className="metric-card">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    نشست امن
                  </p>
                  <p>ورود با نشست محافظت‌شده انجام می‌شود و رابط فقط داده‌های موردنیاز حساب شما را دریافت می‌کند.</p>
                </div>
                <div className="metric-card">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                    <KeyRound className="h-4 w-4 text-primary" />
                    نقش‌ها و دسترسی‌های روشن
                  </p>
                  <p>حساب پرتال از دسترسی مصرفی APIها جداست و هر دسترسی از داشبورد قابل پیگیری است.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardContent className="p-6 text-sm leading-7 text-muted-foreground">
                <p className="mb-2 font-semibold text-foreground">حساب نمونه برای QA</p>
                <p>اگر در محیط محلی با داده نمونه کار می‌کنید، این حساب در فرآیند seed ساخته می‌شود و داشبورد را با داده واقعی‌تر باز می‌کند.</p>
                <div className="mt-4 grid gap-3 rounded-md border border-border/70 bg-background/60 p-4">
                  <div className="grid gap-2 text-left font-mono text-xs" dir="ltr">
                    <code>username: {demoCredentials.username}</code>
                    <code>password: {demoCredentials.password}</code>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={fillDemoAccount}>
                    <KeyRound className="h-4 w-4" />
                    پر کردن حساب نمونه
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
