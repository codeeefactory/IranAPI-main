import { ArrowLeft, Blocks, ChartNoAxesColumn, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAPIs, useCategories } from "@/hooks/useApi";
import heroBg from "@/assets/hero-bg.jpg";
import heroBg480 from "@/assets/hero-bg-480.webp";
import heroBg768 from "@/assets/hero-bg-768.webp";
import heroBg960 from "@/assets/hero-bg-960.webp";
import { getHomeBootstrap } from "@/lib/bootstrap";
import { usePageMetadata } from "@/lib/metadata";
import { DEFAULT_DESCRIPTION, formatCurrencyLabel, formatFaNumber, SITE_NAME, toSiteUrl } from "@/lib/site";

export default function Index() {
  const bootstrap = getHomeBootstrap();
  const { data: apis, isLoading: apisLoading } = useAPIs({ ordering: "-rating" }, { initialData: bootstrap?.apis });
  const { data: featuredApis, isLoading: featuredLoading } = useAPIs(
    { featured: true, ordering: "-rating" },
    { initialData: bootstrap?.featuredApis },
  );
  const { data: categories, isLoading: categoriesLoading } = useCategories(undefined, {
    initialData: bootstrap?.categories,
  });

  const featured = featuredApis?.results ?? [];
  const categoryItems = categories?.results.slice(0, 4) ?? [];
  const apiCount = apis?.count ?? 0;
  const categoryCount = categories?.count ?? 0;

  usePageMetadata({
    title: "پرتال توسعه‌دهندگان و بازار API",
    description: DEFAULT_DESCRIPTION,
    path: "/",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: toSiteUrl("/"),
        inLanguage: "fa-IR",
        description: DEFAULT_DESCRIPTION,
        potentialAction: {
          "@type": "SearchAction",
          target: `${toSiteUrl("/browse")}?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "مرور APIها در IranAPI",
        url: toSiteUrl("/"),
        description: DEFAULT_DESCRIPTION,
      },
    ],
  });

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="page-hero grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div className="space-y-6">
            <span className="cyber-kicker">بازار مدرن API برای تیم‌های محصول و توسعه</span>
            <div className="space-y-4">
              <h1 className="section-title cyber-title">کشف، ارزیابی و مدیریت APIها در یک تجربه سریع، شفاف و فارسی</h1>
              <p className="section-copy">
                IranAPI فهرست زنده سرویس‌ها، مستندات، پلن‌های قیمت‌گذاری و مسیر مدیریت دسترسی را در یک فضای واضح و قابل‌استفاده جمع می‌کند؛ بدون شلوغی بصری و بدون ابهام در جریان تصمیم‌گیری.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/browse" className="gap-2">
                  شروع مرور APIها
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/documentation">مطالعه مستندات</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="stat-chip">
                <Sparkles className="h-4 w-4 text-primary" />
                {apisLoading ? "..." : `${formatFaNumber(apiCount)} API فعال`}
              </span>
              <span className="stat-chip">
                <Blocks className="h-4 w-4 text-primary" />
                {categoriesLoading ? "..." : `${formatFaNumber(categoryCount)} دسته‌بندی`}
              </span>
              <span className="stat-chip">
                <ShieldCheck className="h-4 w-4 text-primary" />
                قرارداد داده یکپارچه و مسیر انتشار شفاف
              </span>
            </div>
          </div>

          <Card className="surface-card">
            <div className="vault-visual">
              <picture>
                <source
                  type="image/webp"
                  srcSet={`${heroBg480} 480w, ${heroBg768} 768w, ${heroBg960} 960w`}
                  sizes="(min-width: 1024px) 36vw, 92vw"
                />
                <img
                  src={heroBg}
                  alt="نمای تصویری یک مرکز فرمان توسعه‌دهنده برای پایش APIها"
                  width="960"
                  height="540"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit">
                مناسب برای استفاده روزمره
              </Badge>
              <h2 className="text-xl font-semibold leading-tight tracking-tight">تمرکز روی وضوح، سرعت و تصمیم‌گیری بهتر</h2>
            </CardHeader>
            <CardContent className="content-list text-sm leading-7 text-muted-foreground">
              <div className="metric-card">
                <p className="mb-2 font-semibold text-foreground">مرور سریع و قابل‌فیلتر</p>
                <p>نتایج با دسته‌بندی، جست‌وجو و مرتب‌سازی به‌سرعت قابل‌مرور هستند و هر سرویس مسیر اقدام مشخصی دارد.</p>
              </div>
              <div className="metric-card">
                <p className="mb-2 font-semibold text-foreground">مستندات و پلن‌ها در یک قاب</p>
                <p>جزئیات فنی، قیمت‌گذاری و وضعیت انتشار هر API کنار هم دیده می‌شوند تا مقایسه ساده‌تر شود.</p>
              </div>
              <div className="metric-card">
                <p className="mb-2 font-semibold text-foreground">داشبورد سازگار با تیم فنی</p>
                <p>دسترسی‌ها، وضعیت اشتراک و داده‌های مصرف از طریق پرتال و با قرارداد v1 قابل پیگیری است.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="section-frame grid gap-4 md:grid-cols-3">
          <Card className="surface-card">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">APIهای موجود</p>
              <p className="text-3xl font-bold">{apisLoading ? "..." : formatFaNumber(apiCount)}</p>
            </CardContent>
          </Card>
          <Card className="surface-card">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">دسته‌بندی‌ها</p>
              <p className="text-3xl font-bold">{categoriesLoading ? "..." : formatFaNumber(categoryCount)}</p>
            </CardContent>
          </Card>
          <Card className="surface-card">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">الگوی دسترسی</p>
              <p className="text-xl font-semibold">IranAPI Vault</p>
            </CardContent>
          </Card>
        </section>

        <section className="section-frame space-y-6">
          <div className="space-y-3">
            <p className="eyebrow">دسته‌های پیشنهادی</p>
            <h2 className="text-2xl font-bold md:text-3xl">برای شروع، از این حوزه‌ها استفاده کنید</h2>
            <p className="section-copy">این دسته‌ها مناسب شروع ارزیابی هستند و معمولا بیشترین تقاضا را برای تیم‌های توسعه و محصول دارند.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoryItems.map((category) => (
              <Card key={category.slug} className="surface-card">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{category.name_en}</Badge>
                    <span className="text-sm text-muted-foreground">{formatFaNumber(category.apis_count)} سرویس</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm leading-7 text-muted-foreground">{category.description}</p>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/browse?category=${category.slug}`}>مشاهده سرویس‌های این دسته</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-frame space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="eyebrow">انتخاب‌های پیشنهادی</p>
              <h2 className="text-2xl font-bold md:text-3xl">APIهای برجسته برای ارزیابی اولیه</h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/browse">مشاهده همه سرویس‌ها</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(featuredLoading ? [] : featured.slice(0, 6)).map((api) => (
              <Card key={api.slug} className="surface-card">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{api.category?.name || "عمومی"}</Badge>
                    {api.is_popular ? <Badge>محبوب</Badge> : null}
                  </div>
                  <CardTitle>{api.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="min-h-16 text-sm leading-7 text-muted-foreground">
                    {api.short_description || "برای این سرویس هنوز توضیح کوتاهی ثبت نشده است."}
                  </p>
                  <div className="grid gap-3 rounded-md bg-muted/50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">امتیاز</p>
                      <p className="font-semibold">{api.rating}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">شروع قیمت</p>
                      <p className="font-semibold">{formatCurrencyLabel(api.pricing_from)}</p>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to={`/api/${api.slug}`}>بررسی جزئیات و مستندات</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-frame grid gap-4 md:grid-cols-3">
          <Card className="surface-card">
            <CardContent className="space-y-3 p-6">
              <Zap className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">جریان تصمیم‌گیری سریع‌تر</h3>
              <p className="text-sm leading-7 text-muted-foreground">از جست‌وجوی اولیه تا انتخاب پلن و مشاهده مستندات، مسیرها مستقیم و بدون اصطکاک طراحی شده‌اند.</p>
            </CardContent>
          </Card>
          <Card className="surface-card">
            <CardContent className="space-y-3 p-6">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">کیفیت محتوای قابل‌اتکا</h3>
              <p className="text-sm leading-7 text-muted-foreground">متادیتای سرویس، روش دسترسی و وضعیت انتشار در یک قرارداد داده واحد نگه‌داری می‌شود.</p>
            </CardContent>
          </Card>
          <Card className="surface-card">
            <CardContent className="space-y-3 p-6">
              <ChartNoAxesColumn className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">پیشنهادهای بهتر برای استفاده</h3>
              <p className="text-sm leading-7 text-muted-foreground">APIهای برجسته، دسته‌های پیشنهادی و سرویس‌های مشابه، انتخاب بعدی را برای کاربر روشن‌تر می‌کنند.</p>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
