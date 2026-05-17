import { Database, Eye, Lock, Shield, UserCheck } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { createBreadcrumbSchema, usePageMetadata } from "@/lib/metadata";
import { toSiteUrl } from "@/lib/site";

const sections = [
  {
    title: "اطلاعات جمع‌آوری‌شده",
    icon: Eye,
    bullets: [
      "اطلاعات حساب کاربری مانند نام کاربری، ایمیل و داده‌های هویتی پایه.",
      "اطلاعات پروفایل توسعه‌دهنده در صورت تکمیل توسط کاربر.",
      "داده‌های مصرف، نشست، لاگ‌های فنی و شاخص‌های عملکرد مرتبط با استفاده از پرتال.",
    ],
  },
  {
    title: "هدف استفاده از داده",
    icon: Database,
    bullets: [
      "ارائه و بهبود تجربه پرتال و داشبورد.",
      "مدیریت نشست، حساب کاربری، گزارش مصرف و پشتیبانی.",
      "پایش فنی، تحلیل عملکرد، کاهش تقلب و رعایت الزامات قانونی.",
    ],
  },
  {
    title: "حفاظت از اطلاعات",
    icon: Shield,
    body:
      "داده‌ها با کنترل‌های متناسب برای انتقال، نگه‌داری و دسترسی محافظت می‌شوند. سطح این کنترل‌ها وابسته به ماهیت داده و محیط عملیاتی است و به‌صورت دوره‌ای بازبینی می‌شود.",
  },
  {
    title: "حقوق کاربر",
    icon: UserCheck,
    bullets: [
      "درخواست مشاهده یا اصلاح اطلاعات پایه حساب و پروفایل.",
      "درخواست حذف یا محدودسازی داده در چارچوب محدودیت‌های فنی و قانونی.",
      "اعلام پرسش یا نگرانی درباره نحوه استفاده از داده‌ها از مسیرهای پشتیبانی.",
    ],
  },
];

const lastUpdated = "20 اردیبهشت 1405";

const Privacy = () => {
  usePageMetadata({
    title: "حریم خصوصی",
    description: "نحوه جمع‌آوری، استفاده، نگه‌داری و محافظت از اطلاعات در پرتال IranAPI را در این صفحه بررسی کنید.",
    path: "/privacy",
    structuredData: [
      createBreadcrumbSchema([
        { name: "خانه", path: "/" },
        { name: "حریم خصوصی", path: "/privacy" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "حریم خصوصی IranAPI",
        url: toSiteUrl("/privacy"),
      },
    ],
  });

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="container page-stack">
        <section className="page-hero space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-8 w-8" />
          </div>
          <p className="eyebrow">Privacy</p>
          <h1 className="section-title">حریم خصوصی</h1>
          <p className="section-copy mx-auto">این صفحه توضیح می‌دهد چه داده‌هایی در پرتال جمع‌آوری می‌شوند، چرا استفاده می‌شوند و کاربر چه سطحی از کنترل روی آن‌ها دارد.</p>
          <p className="text-sm text-muted-foreground">آخرین به‌روزرسانی: {lastUpdated}</p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="surface-card p-6">
                <section className="space-y-4">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </h2>
                  {"body" in section ? <p className="leading-7 text-muted-foreground">{section.body}</p> : null}
                  {"bullets" in section ? (
                    <ul className="grid gap-2 text-sm leading-7 text-muted-foreground">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>• {bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              </Card>
            );
          })}
        </div>

        <Card className="surface-card p-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">اشتراک‌گذاری و کوکی‌ها</h2>
            <p className="leading-7 text-muted-foreground">
              داده‌های کاربر فروخته نمی‌شوند. اشتراک‌گذاری فقط در حد لازم برای زیرساخت، پردازش سرویس‌های وابسته، رعایت قانون یا مدیریت عملیات انجام می‌شود. کوکی‌ها و فناوری‌های مشابه برای نگه‌داری نشست، بهبود تجربه و تحلیل محدود عملکرد استفاده می‌شوند.
            </p>
          </section>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
