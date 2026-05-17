import { ArrowLeft, CircleAlert, Route, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePricingPlans } from "@/hooks/useApi";
import { usePageMetadata } from "@/lib/metadata";

export default function Payment() {
  const [searchParams] = useSearchParams();
  const selectedPlanId = Number(searchParams.get("plan") || "0");
  const { data: pricingPlans } = usePricingPlans();
  const plan = pricingPlans?.results.find((item) => item.id === selectedPlanId);
  const isReadyForActivation = Boolean(plan?.is_listed_on_rapidapi);

  usePageMetadata({
    title: "فعال‌سازی دسترسی",
    description: "مسیر فعال‌سازی پلن، بررسی محدودیت‌ها و بازگشت به داشبورد IranAPI را از این صفحه دنبال کنید.",
    path: selectedPlanId ? `/payment?plan=${selectedPlanId}` : "/payment",
    noindex: true,
  });

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="page-hero grid gap-6 lg:grid-cols-[0.95fr,1.05fr] lg:items-start">
          <div className="space-y-5">
            <Button variant="ghost" className="w-fit px-0" asChild>
              <Link to="/pricing" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                بازگشت به قیمت‌گذاری
              </Link>
            </Button>

            <div className="space-y-3">
              <p className="eyebrow">Access Route</p>
              <h1 className="section-title">فعال‌سازی دسترسی IranAPI</h1>
              <p className="section-copy">
                این مسیر برای فعال‌سازی شفاف دسترسی، بررسی سقف مصرف و اتصال حساب توسعه‌دهنده به سرویس‌های IranAPI ساخته شده است. همه چیز داخل پرتال مستقل IranAPI مدیریت می‌شود.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="stat-chip">
                <Route className="h-4 w-4 text-primary" />
                مسیر دسترسی شفاف
              </span>
              <span className="stat-chip">
                <ShieldCheck className="h-4 w-4 text-primary" />
                بدون درگاه جعلی
              </span>
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="surface-card">
              <CardHeader>
                <CardTitle>پلن انتخاب‌شده</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xl font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">{plan.plan_type}</p>
                      </div>
                      <Badge>
                        {plan.price} {plan.currency}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>درخواست روزانه: {plan.requests_per_day?.toLocaleString("fa-IR") || "نامشخص"}</p>
                      <p>درخواست ماهانه: {plan.requests_per_month?.toLocaleString("fa-IR") || "نامشخص"}</p>
                      <p>وضعیت دسترسی: {isReadyForActivation ? "آماده فعال‌سازی در IranAPI" : "در حال آماده‌سازی"}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">پلن انتخاب‌شده پیدا نشد. از صفحه قیمت‌گذاری یک پلن معتبر انتخاب کنید.</p>
                )}
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center gap-3">
                <CircleAlert className="h-5 w-5 text-accent" />
                <CardTitle>مسیر درست فعال‌سازی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                <div className="metric-card">
                  <p className="mb-2 font-semibold text-foreground">1. بررسی پلن و محدودیت‌ها</p>
                  <p>ابتدا سقف مصرف، نوع پلن و وضعیت آماده‌بودن سرویس را داخل IranAPI بررسی کنید.</p>
                </div>
                <div className="metric-card">
                  <p className="mb-2 font-semibold text-foreground">2. فعال‌سازی از حساب IranAPI</p>
                  <p>دسترسی باید از حساب پرتال فعال شود تا کلیدها، محدودیت‌ها و گزارش مصرف در یک مسیر امن و واحد نگه‌داری شوند.</p>
                </div>
                <div className="metric-card">
                  <p className="mb-2 font-semibold text-foreground">3. بازگشت به داشبورد</p>
                  <p>بعد از فعال‌سازی، وضعیت دسترسی و استفاده را از داشبورد پرتال پیگیری کنید.</p>
                </div>

                {isReadyForActivation ? (
                  <div className="rounded-md border border-accent/30 bg-accent/10 p-4">
                    <p className="font-semibold text-foreground">این پلن آماده فعال‌سازی است</p>
                    <p className="mt-2">برای ادامه، داشبورد را باز کنید، سرویس را بررسی کنید و مسیر دسترسی را از داخل IranAPI نهایی کنید.</p>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-accent/35 bg-accent/10 p-4">
                    <p className="font-semibold text-foreground">این پلن هنوز برای فعال‌سازی آماده نشده است</p>
                    <p className="mt-2">تا زمان تکمیل آماده‌سازی، این صفحه فقط وضعیت پلن را نمایش می‌دهد و مسیر فعال‌سازی در دسترس نخواهد بود.</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/dashboard">رفتن به داشبورد</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/browse">مرور APIها</Link>
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
