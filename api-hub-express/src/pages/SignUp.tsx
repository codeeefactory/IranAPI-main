import { AlertTriangle, CheckCircle2, KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { SocialAuthPanel } from "@/components/SocialAuthPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister, useSession } from "@/hooks/useApi";
import { getErrorMessage } from "@/lib/api";
import { usePageMetadata } from "@/lib/metadata";

export default function SignUp() {
  const navigate = useNavigate();
  const register = useRegister();
  const session = useSession();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  });

  usePageMetadata({
    title: "ثبت‌نام",
    description: "حساب توسعه‌دهنده IranAPI را بسازید تا به داشبورد، مشخصات کاربری و گزارش‌های مصرف دسترسی داشته باشید.",
    path: "/signup",
    noindex: true,
  });

  useEffect(() => {
    if (session.data?.authenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, session.data?.authenticated]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!acceptedTerms) {
      const message = "برای ساخت حساب باید شرایط استفاده را بپذیرید.";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (formData.password !== formData.password_confirm) {
      const message = "رمزهای عبور با هم مطابقت ندارند.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      await register.mutateAsync({
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        first_name: formData.first_name.trim() || undefined,
        last_name: formData.last_name.trim() || undefined,
        password: formData.password,
        password_confirm: formData.password_confirm,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "ثبت‌نام انجام نشد. اطلاعات فرم را بررسی کنید."));
    }
  };

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="page-hero grid gap-6 lg:grid-cols-[1.12fr,0.88fr] lg:items-start">
          <Card className="surface-card">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">ثبت‌نام توسعه‌دهنده</Badge>
                <Badge variant="outline">IranAPI Access</Badge>
              </div>
              <div className="space-y-3">
                <p className="eyebrow">ساخت حساب</p>
                <CardTitle className="text-3xl">ایجاد حساب پرتال IranAPI</CardTitle>
                <p className="text-sm leading-7 text-muted-foreground">
                  با این حساب به داشبورد، پروفایل توسعه‌دهنده، وضعیت دسترسی‌ها، کلیدهای امن و گزارش مصرف دسترسی پیدا می‌کنید. فعال‌سازی مصرفی APIها داخل IranAPI انجام می‌شود.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <SocialAuthPanel mode="signup" />

              {formError ? (
                <div className="flex items-start gap-3 rounded-md border border-destructive/35 bg-destructive/10 p-4 text-sm leading-7 text-destructive" role="alert">
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              ) : null}

              <form className="space-y-4 rounded-md border border-border/70 bg-background/45 p-4 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.07)]" onSubmit={handleSubmit} aria-busy={register.isPending}>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-black uppercase tracking-[0.22em] text-primary">Identity Forge</span>
                  <span>API vault profile</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">نام</Label>
                    <Input
                      id="first_name"
                      autoComplete="given-name"
                      value={formData.first_name}
                      onChange={(event) => {
                        setFormError("");
                        setFormData((current) => ({ ...current, first_name: event.target.value }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">نام خانوادگی</Label>
                    <Input
                      id="last_name"
                      autoComplete="family-name"
                      value={formData.last_name}
                      onChange={(event) => {
                        setFormError("");
                        setFormData((current) => ({ ...current, last_name: event.target.value }));
                      }}
                    />
                  </div>
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
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(event) => {
                      setFormError("");
                      setFormData((current) => ({ ...current, email: event.target.value }));
                    }}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(event) => {
                        setFormError("");
                        setFormData((current) => ({ ...current, password: event.target.value }));
                      }}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirm">تکرار رمز عبور</Label>
                    <Input
                      id="password_confirm"
                      type="password"
                      autoComplete="new-password"
                      value={formData.password_confirm}
                      onChange={(event) => {
                        setFormError("");
                        setFormData((current) => ({ ...current, password_confirm: event.target.value }));
                      }}
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-md border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  <Checkbox
                    id="accepted_terms"
                    aria-label="پذیرش شرایط استفاده و حریم خصوصی"
                    checked={acceptedTerms}
                    onCheckedChange={(value) => {
                      setFormError("");
                      setAcceptedTerms(Boolean(value));
                    }}
                  />
                  <label htmlFor="accepted_terms" className="leading-7">
                    با{" "}
                    <Link to="/terms" className="text-primary">
                      شرایط استفاده
                    </Link>{" "}
                    و{" "}
                    <Link to="/privacy" className="text-primary">
                      حریم خصوصی
                    </Link>{" "}
                    موافقم.
                  </label>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2" disabled={register.isPending}>
                  <UserPlus className="h-4 w-4" />
                  {register.isPending ? "در حال ساخت حساب..." : "ساخت حساب"}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground">
                قبلا ثبت‌نام کرده‌اید؟{" "}
                <Link to="/signin" className="font-medium text-primary">
                  ورود
                </Link>
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="surface-card">
              <CardContent className="content-list p-6 text-sm leading-7 text-muted-foreground">
                <div className="metric-card">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    بعد از ثبت‌نام چه چیزهایی فعال می‌شود؟
                  </p>
                  <p>دسترسی به داشبورد، ثبت و ویرایش اطلاعات حساب، مدیریت پروفایل توسعه‌دهنده و مشاهده داده‌های مصرفی.</p>
                </div>
                <div className="metric-card">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    مسیر روشن دسترسی API
                  </p>
                  <p>این فرم حساب پرتال را ایجاد می‌کند. فعال‌سازی پلن API از مسیر مدیریت‌شده IranAPI انجام می‌شود تا دسترسی، مصرف و کلیدها شفاف بمانند.</p>
                </div>
                <div className="metric-card">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                    <KeyRound className="h-4 w-4 text-primary" />
                    حداقل استاندارد امنیت
                  </p>
                  <p>برای رمز عبور حداقل طول ۸ کاراکتر اعمال شده و نشست کاربر از مسیر امن و مبتنی بر کوکی مدیریت می‌شود.</p>
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
