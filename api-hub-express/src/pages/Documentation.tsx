import {
  Activity,
  ArrowLeft,
  BookOpen,
  Braces,
  CircuitBoard,
  ExternalLink,
  FileCode2,
  Gauge,
  Search,
  ShieldCheck,
  TerminalSquare,
  Workflow,
  Zap,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAPIs, useDocumentations } from "@/hooks/useApi";
import { getDocumentationBootstrap } from "@/lib/bootstrap";
import { createBreadcrumbSchema, usePageMetadata } from "@/lib/metadata";
import { formatFaNumber, toSiteUrl } from "@/lib/site";

const operatingSignals = [
  { label: "Latency budget", value: "< 120ms", icon: Gauge },
  { label: "Auth flow", value: "Session + Token", icon: ShieldCheck },
  { label: "Versioning", value: "v1 canonical", icon: Workflow },
];

const playbooks = [
  {
    title: "ساخت حساب و آماده‌سازی دسترسی",
    copy: "ابتدا حساب توسعه‌دهنده بسازید، سپس از داشبورد وضعیت پروفایل، نشست فعال و مسیر دسترسی به سرویس‌ها را کنترل کنید.",
    icon: TerminalSquare,
  },
  {
    title: "بررسی مستندات و قرارداد API",
    copy: "برای هر سرویس، توضیح فنی، پلن‌ها، مسیر فعال‌سازی و نمونه قرارداد داده را کنار هم بخوانید تا انتخاب سریع‌تر شود.",
    icon: FileCode2,
  },
  {
    title: "فعال‌سازی اشتراک و پایش مصرف",
    copy: "فعال‌سازی دسترسی از مسیر مستقل IranAPI انجام می‌شود و مصرف از پرتال قابل پیگیری است.",
    icon: Activity,
  },
];

const commandLines = [
  "curl /api/v1/catalog/apis/?ordering=-rating",
  "GET /api/v1/catalog/documentations/?page_size=100",
  "X-Request-ID: iranapi-trace",
];

export default function Documentation() {
  const bootstrap = getDocumentationBootstrap();
  const { data: apis } = useAPIs({ ordering: "name", page_size: 100 }, { initialData: bootstrap?.apis });
  const [selectedApi, setSelectedApi] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());
  const { data: docs, isLoading } = useDocumentations(selectedApi || undefined, undefined, {
    initialData: !selectedApi ? bootstrap?.documentations : undefined,
  });

  usePageMetadata({
    title: "مستندات",
    description:
      "مستندات زنده، راهنماهای فنی و مسیر فعال‌سازی سرویس‌ها را در مرکز راهنمای IranAPI مرور کنید.",
    path: "/documentation",
    structuredData: [
      createBreadcrumbSchema([
        { name: "خانه", path: "/" },
        { name: "مستندات", path: "/documentation" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "مستندات IranAPI",
        url: toSiteUrl("/documentation"),
      },
    ],
  });

  const documentationItems = useMemo(() => docs?.results || [], [docs?.results]);
  const filteredDocs = useMemo(() => {
    if (!deferredSearch) {
      return documentationItems;
    }

    return documentationItems.filter(
      (doc) => doc.title.toLowerCase().includes(deferredSearch) || doc.content.toLowerCase().includes(deferredSearch),
    );
  }, [deferredSearch, documentationItems]);

  const selectedApiName = apis?.results.find((api) => api.slug === selectedApi)?.name || "همه APIها";

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="cyber-doc-hero overflow-hidden">
          <div className="cyber-grid" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[1.08fr,0.92fr] lg:items-center">
            <div className="space-y-6">
              <span className="cyber-kicker">
                <CircuitBoard className="h-4 w-4" />
                مرکز عملیات مستندات
              </span>

              <div className="space-y-4">
                <h1 className="cyber-display">راهنمای زنده برای اتصال، تست و انتشار APIها</h1>
                <p className="section-copy">
                  این صفحه مثل یک کنسول توسعه‌دهنده عمل می‌کند: مستندات بک‌اند را می‌خواند، جست‌وجو و فیلتر را همزمان نگه می‌دارد و مسیر عملیاتی هر سرویس را بدون شلوغی نشان می‌دهد.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {operatingSignals.map((signal) => {
                  const Icon = signal.icon;
                  return (
                    <div key={signal.label} className="signal-tile">
                      <Icon className="h-4 w-4 text-accent" />
                      <span className="text-[11px] uppercase text-muted-foreground">{signal.label}</span>
                      <strong>{signal.value}</strong>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/browse" className="gap-2">
                    مرور APIها
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/api/speech-gateway" className="gap-2">
                    نمونه سرویس
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="terminal-panel">
              <div className="terminal-topbar">
                <span />
                <span />
                <span />
                <p>iranapi-docs://live</p>
              </div>
              <div className="space-y-4 p-5">
                {commandLines.map((line) => (
                  <div key={line} className="command-line">
                    <span>$</span>
                    <code>{line}</code>
                  </div>
                ))}
                <div className="rounded-md border border-accent/25 bg-accent/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Zap className="h-4 w-4 text-accent" />
                    وضعیت زنده
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <span>docs: {isLoading ? "syncing..." : `${formatFaNumber(documentationItems.length)} سند فعال`}</span>
                    <span>scope: {selectedApiName}</span>
                    <span>query: {searchValue || "بدون جست‌وجو"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-control-deck">
          <div className="space-y-2">
            <label htmlFor="documentation-search" className="text-sm font-semibold text-foreground">
              جست‌وجو در مستندات
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="documentation-search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="عنوان، محتوا یا کلیدواژه فنی را وارد کنید"
                className="h-12 pr-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="documentation-api" className="text-sm font-semibold text-foreground">
              فیلتر API
            </label>
            <select
              id="documentation-api"
              value={selectedApi}
              onChange={(event) => setSelectedApi(event.target.value)}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">همه APIها</option>
              {apis?.results.map((api) => (
                <option key={api.slug} value={api.slug}>
                  {api.name}
                </option>
              ))}
            </select>
          </div>

          <div className="docs-count-card">
            <span>نتیجه فعال</span>
            <strong>{isLoading ? "..." : formatFaNumber(filteredDocs.length)}</strong>
          </div>
        </section>

        <section className="section-frame grid gap-6 xl:grid-cols-[1fr,360px]" aria-busy={isLoading}>
          <Card className="surface-card docs-list-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                فهرست مستندات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="doc-skeleton" />
                  ))}
                </div>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc, index) => (
                  <article key={doc.slug} className="doc-record">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="record-index">{formatFaNumber(index + 1)}</span>
                        <h3 className="text-lg font-semibold">{doc.title}</h3>
                      </div>
                      <Badge variant="outline">{doc.api_slug}</Badge>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{doc.content}</p>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <Braces className="h-8 w-8 text-primary" />
                  <p className="font-semibold text-foreground">برای این فیلتر مستندی پیدا نشد.</p>
                  <p className="text-sm text-muted-foreground">عبارت جست‌وجو را کوتاه‌تر کنید یا فیلتر API را به همه سرویس‌ها برگردانید.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="grid gap-4 content-start">
            {playbooks.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="surface-card playbook-card">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-5 w-5 text-accent" />
                      <span className="record-index">{formatFaNumber(index + 1)}</span>
                    </div>
                    <h2 className="text-base font-semibold">{item.title}</h2>
                    <p className="text-sm leading-7 text-muted-foreground">{item.copy}</p>
                  </CardContent>
                </Card>
              );
            })}

            <Button variant="outline" asChild>
              <Link to="/browse" className="gap-2">
                رفتن به فهرست APIها
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
}
