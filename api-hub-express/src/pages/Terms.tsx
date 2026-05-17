import { AlertCircle, CheckCircle, FileText, Shield } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { createBreadcrumbSchema, usePageMetadata } from "@/lib/metadata";
import { toSiteUrl } from "@/lib/site";

const sections = [
  {
    title: "پذیرش شرایط",
    icon: Shield,
    body:
      "با استفاده از خدمات IranAPI شما می‌پذیرید که استفاده از پرتال، داشبورد و داده‌های ارائه‌شده مطابق این شرایط انجام شود. اگر با هر بخش موافق نیستید، استفاده از سرویس را متوقف کنید.",
  },
  {
    title: "استفاده مجاز",
    icon: CheckCircle,
    bullets: [
      "استفاده فقط برای فعالیت قانونی و مجاز انجام می‌شود.",
      "دسترسی غیرمجاز، سوءاستفاده از داده‌ها یا دور زدن محدودیت‌های سرویس ممنوع است.",
      "ارسال بدافزار، ایجاد اختلال یا استفاده برای اسپم مجاز نیست.",
    ],
  },
  {
    title: "حساب کاربری و امنیت",
    icon: AlertCircle,
    bullets: [
      "کاربر مسئول نگه‌داری از اطلاعات ورود و هر اعتبارنامه خارجی متصل به سرویس‌ها است.",
      "در صورت مشاهده فعالیت مشکوک باید سریعا موضوع را گزارش کند.",
      "در صورت نقض شرایط، دسترسی پرتال یا سرویس می‌تواند محدود یا تعلیق شود.",
    ],
  },
  {
    title: "محدودیت مسئولیت",
    icon: FileText,
    body:
      "خدمات به‌صورت موجود ارائه می‌شوند و IranAPI تضمین مطلقی برای در دسترس بودن، دقت یا تناسب برای کاربرد خاص ارائه نمی‌کند. حدود مسئولیت بر اساس قوانین و قراردادهای جاری تفسیر می‌شود.",
  },
];

const lastUpdated = "20 اردیبهشت 1405";

const Terms = () => {
  usePageMetadata({
    title: "شرایط استفاده",
    description: "قواعد استفاده از پرتال IranAPI، مسئولیت‌ها، محدودیت‌ها و چارچوب استفاده از خدمات را در این صفحه مطالعه کنید.",
    path: "/terms",
    structuredData: [
      createBreadcrumbSchema([
        { name: "خانه", path: "/" },
        { name: "شرایط استفاده", path: "/terms" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "شرایط استفاده IranAPI",
        url: toSiteUrl("/terms"),
      },
    ],
  });

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="container page-stack">
        <section className="page-hero space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-8 w-8" />
          </div>
          <p className="eyebrow">Legal</p>
          <h1 className="section-title">شرایط استفاده از خدمات</h1>
          <p className="section-copy mx-auto">این صفحه چارچوب استفاده از پرتال، مسئولیت‌های کاربر و حدود عملکرد سرویس را به زبان روشن و خلاصه توضیح می‌دهد.</p>
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
            <h2 className="text-xl font-semibold">نکات تکمیلی</h2>
            <p className="leading-7 text-muted-foreground">
              سیاست‌های مربوط به محدودیت استفاده، مالکیت فکری، اصلاح شرایط و مسیرهای ارتباطی ممکن است با رشد محصول و زیرساخت به‌روزرسانی شوند. استفاده مستمر از سرویس به‌معنای پذیرش نسخه جاری این شرایط است.
            </p>
          </section>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
