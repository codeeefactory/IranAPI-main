import { Link } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAPIs, usePricingPlans } from "@/hooks/useApi";
import { getPricingBootstrap } from "@/lib/bootstrap";
import { createBreadcrumbSchema, usePageMetadata } from "@/lib/metadata";
import { formatCurrencyLabel, formatFaNumber, toSiteUrl } from "@/lib/site";

export default function Pricing() {
  const bootstrap = getPricingBootstrap();
  const { data: pricingPlans, isLoading } = usePricingPlans(undefined, undefined, {
    initialData: bootstrap?.pricingPlans,
  });
  const { data: apis } = useAPIs({ ordering: "name", page_size: 100 }, { initialData: bootstrap?.apis });
  const apiMap = new Map((apis?.results || []).map((api) => [api.slug, api.name]));

  usePageMetadata({
    title: "قیمت‌گذاری",
    description: "پلن‌های فعال، سقف مصرف و وضعیت آماده‌سازی سرویس‌ها را قبل از فعال‌سازی دسترسی در IranAPI مقایسه کنید.",
    path: "/pricing",
    structuredData: [
      createBreadcrumbSchema([
        { name: "خانه", path: "/" },
        { name: "قیمت‌گذاری", path: "/pricing" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "قیمت‌گذاری APIها",
        url: toSiteUrl("/pricing"),
      },
    ],
  });

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="page-hero space-y-6">
          <div className="space-y-3">
            <p className="eyebrow">پلن‌های زنده</p>
            <h1 className="section-title">مقایسه قیمت، سقف مصرف و وضعیت انتشار</h1>
            <p className="section-copy">
              این صفحه داده پلن‌های ثبت‌شده در بک‌اند را به‌صورت زنده نشان می‌دهد و مرجع تصمیم‌گیری برای انتخاب مسیر
              اشتراک یا ارزیابی وضعیت انتشار هر سرویس است.
            </p>
          </div>

          <div className="section-frame grid gap-4 md:grid-cols-3">
            <Card className="surface-card">
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-muted-foreground">پلن‌های ثبت‌شده</p>
                <p className="text-3xl font-bold">{formatFaNumber(pricingPlans?.count || 0)}</p>
              </CardContent>
            </Card>
            <Card className="surface-card">
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-muted-foreground">سرویس‌های دارای پلن</p>
                <p className="text-3xl font-bold">{formatFaNumber(new Set((pricingPlans?.results || []).map((item) => item.api_slug)).size)}</p>
              </CardContent>
            </Card>
            <Card className="surface-card">
              <CardContent className="space-y-2 p-6">
                <p className="text-sm text-muted-foreground">پلن‌های محبوب</p>
                <p className="text-3xl font-bold">{formatFaNumber((pricingPlans?.results || []).filter((item) => item.is_popular).length)}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <h2 className="sr-only">Pricing plans list</h2>

        {isLoading ? (
          <div className="section-frame grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-64 animate-pulse bg-muted/60" />
            ))}
          </div>
        ) : pricingPlans?.results && pricingPlans.results.length > 0 ? (
          <div className="section-frame grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pricingPlans.results.map((plan) => (
              <Card key={plan.id} className="surface-card">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{apiMap.get(plan.api_slug) || plan.api_slug}</Badge>
                    {plan.is_popular ? <Badge>محبوب</Badge> : null}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-2xl font-bold">{formatCurrencyLabel(plan.price, plan.currency)}</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>نوع پلن: {plan.plan_type}</p>
                    <p>درخواست روزانه: {plan.requests_per_day ? formatFaNumber(plan.requests_per_day) : "نامشخص"}</p>
                    <p>درخواست ماهانه: {plan.requests_per_month ? formatFaNumber(plan.requests_per_month) : "نامشخص"}</p>
                    <p>وضعیت دسترسی: {plan.is_listed_on_rapidapi ? "آماده فعال‌سازی در IranAPI" : "در حال آماده‌سازی"}</p>
                  </div>
                  {plan.features.length > 0 ? (
                    <ul className="space-y-2 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
                      {plan.features.map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex gap-3">
                    <Button className="flex-1" asChild>
                      <Link to={`/payment?plan=${plan.id}`}>
                        {plan.is_listed_on_rapidapi ? "فعال‌سازی دسترسی" : "وضعیت آماده‌سازی"}
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to={`/api/${plan.api_slug}`}>جزئیات API</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="space-y-4 p-8 text-center">
              <h2 className="text-xl font-semibold">پلن فعالی ثبت نشده است</h2>
              <p className="text-muted-foreground">فعلا از پنل ادمین یا بک‌اند پلن‌های قیمت‌گذاری بیشتری اضافه کنید.</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
