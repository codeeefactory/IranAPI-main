import { BookOpen, Check, Copy, ExternalLink, Eye, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ApiStatusBadge, AuthSchemeBadge, HealthSignalBadge, MethodBadge, SecurityNotice } from "@/components/ApiVaultBadges";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAPI, useRateAPI, useSession, useSimilarAPIs } from "@/hooks/useApi";
import { getApiDetailBootstrap } from "@/lib/bootstrap";
import { createBreadcrumbSchema, usePageMetadata } from "@/lib/metadata";
import { formatCurrencyLabel, formatFaNumber, SITE_NAME, toSiteUrl } from "@/lib/site";

const accessSchemeLabels: Record<string, string> = {
  rapidapi_proxy: "دروازه اختصاصی IranAPI",
  api_key: "کلید API اختصاصی",
  none: "دسترسی عمومی",
};

const publicationStatusLabels: Record<string, string> = {
  draft: "پیش‌نویس",
  ready: "آماده فعال‌سازی",
  published: "فعال در IranAPI",
  deprecated: "بازنشسته",
};

type CodeLanguage = {
  id: string;
  label: string;
  code: string;
};

const jsonHeaders = {
  Authorization: "Bearer <IRANAPI_API_KEY>",
  "X-IranAPI-Client": "<CLIENT_ID>",
  "Content-Type": "application/json",
};

function samplePathForApi(slug: string) {
  if (slug.includes("speech")) {
    return {
      path: "/speech/transcriptions",
      payload: {
        audio_url: "https://cdn.example.com/audio/sample-fa.wav",
        language: "fa-IR",
        diarization: true,
      },
    };
  }

  if (slug.includes("payment")) {
    return {
      path: "/payments/verify",
      payload: {
        transaction_id: "txn_123456789",
        amount: 250000,
        currency: "IRR",
      },
    };
  }

  if (slug.includes("geo")) {
    return {
      path: "/routes/optimize",
      payload: {
        origin: { lat: 35.7219, lng: 51.3347 },
        destination: { lat: 35.6892, lng: 51.389 },
        mode: "driving",
      },
    };
  }

  return {
    path: "/requests",
    payload: {
      query: "sample request",
      locale: "fa-IR",
    },
  };
}

function buildApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

function indentJson(value: unknown, spaces = 2) {
  return JSON.stringify(value, null, spaces);
}

function buildLanguageSamples(api: { base_url?: string; slug: string; rapidapi: { public_auth_scheme: string } }): CodeLanguage[] {
  if (!api.base_url) {
    return [];
  }

  const { path, payload } = samplePathForApi(api.slug);
  const url = buildApiUrl(api.base_url, path);
  const needsAuth = api.rapidapi.public_auth_scheme === "rapidapi_proxy" || api.rapidapi.public_auth_scheme === "api_key";
  const headers = needsAuth ? jsonHeaders : { "Content-Type": "application/json" };
  const headersJson = indentJson(headers, 2);
  const payloadJson = indentJson(payload, 2);
  const compactPayload = JSON.stringify(payload);

  return [
    {
      id: "curl",
      label: "cURL",
      code: `curl --request POST \\
  --url '${url}' \\
  ${needsAuth ? "--header 'Authorization: Bearer <IRANAPI_API_KEY>' \\\n  --header 'X-IranAPI-Client: <CLIENT_ID>' \\\n  " : ""}--header 'Content-Type: application/json' \\
  --data '${compactPayload}'`,
    },
    {
      id: "javascript",
      label: "JavaScript",
      code: `const response = await fetch("${url}", {
  method: "POST",
  headers: ${headersJson},
  body: JSON.stringify(${payloadJson}),
});

if (!response.ok) {
  throw new Error(\`IranAPI request failed: \${response.status}\`);
}

const data = await response.json();
console.log(data);`,
    },
    {
      id: "typescript",
      label: "TypeScript",
      code: `type IranApiResponse = Record<string, unknown>;

const payload = ${payloadJson} satisfies Record<string, unknown>;

const response = await fetch("${url}", {
  method: "POST",
  headers: ${headersJson},
  body: JSON.stringify(payload),
});

if (!response.ok) {
  throw new Error(\`IranAPI request failed: \${response.status}\`);
}

const data = (await response.json()) as IranApiResponse;
console.log(data);`,
    },
    {
      id: "python",
      label: "Python",
      code: `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 4)}
payload = ${JSON.stringify(payload, null, 4)}

response = requests.post(url, json=payload, headers=headers, timeout=30)
response.raise_for_status()

print(response.json())`,
    },
    {
      id: "node",
      label: "Node.js",
      code: `import axios from "axios";

const { data } = await axios.post(
  "${url}",
  ${payloadJson},
  {
    headers: ${headersJson},
    timeout: 30000,
  },
);

console.log(data);`,
    },
    {
      id: "php",
      label: "PHP",
      code: `<?php
$url = "${url}";
$payload = ${JSON.stringify(payload, null, 2)};

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
${needsAuth ? '        "Authorization: Bearer <IRANAPI_API_KEY>",\n        "X-IranAPI-Client: <CLIENT_ID>",\n' : ""}        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);

$response = curl_exec($ch);
if ($response === false) {
    throw new RuntimeException(curl_error($ch));
}

curl_close($ch);
echo $response;`,
    },
    {
      id: "go",
      label: "Go",
      code: `package main

import (
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
)

func main() {
  payload := map[string]any${JSON.stringify(payload, null, 2)
    .replace(/"([^"]+)":/g, '"$1":')
    .replace(/true/g, "true")
    .replace(/false/g, "false")}

  body, _ := json.Marshal(payload)
  req, _ := http.NewRequest("POST", "${url}", bytes.NewReader(body))
${needsAuth ? '  req.Header.Set("Authorization", "Bearer <IRANAPI_API_KEY>")\n  req.Header.Set("X-IranAPI-Client", "<CLIENT_ID>")\n' : ""}  req.Header.Set("Content-Type", "application/json")

  res, err := http.DefaultClient.Do(req)
  if err != nil {
    panic(err)
  }
  defer res.Body.Close()

  fmt.Println(res.Status)
}`,
    },
    {
      id: "csharp",
      label: "C#",
      code: `using System.Net.Http.Headers;
using System.Text;

using var client = new HttpClient();
${needsAuth ? 'client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "<IRANAPI_API_KEY>");\nclient.DefaultRequestHeaders.Add("X-IranAPI-Client", "<CLIENT_ID>");\n' : ""}
var json = """
${payloadJson}
""";

using var content = new StringContent(json, Encoding.UTF8, "application/json");
using var response = await client.PostAsync("${url}", content);
response.EnsureSuccessStatusCode();

Console.WriteLine(await response.Content.ReadAsStringAsync());`,
    },
    {
      id: "java",
      label: "Java",
      code: `HttpClient client = HttpClient.newHttpClient();
String body = """
${payloadJson}
""";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
${needsAuth ? '    .header("Authorization", "Bearer <IRANAPI_API_KEY>")\n    .header("X-IranAPI-Client", "<CLIENT_ID>")\n' : ""}    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
    },
    {
      id: "ruby",
      label: "Ruby",
      code: `require "json"
require "net/http"

uri = URI("${url}")
request = Net::HTTP::Post.new(uri)
${needsAuth ? 'request["Authorization"] = "Bearer <IRANAPI_API_KEY>"\nrequest["X-IranAPI-Client"] = "<CLIENT_ID>"\n' : ""}request["Content-Type"] = "application/json"
request.body = ${payloadJson}.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") do |http|
  http.request(request)
end

puts response.body`,
    },
  ];
}

export default function ApiDetails() {
  const { slug } = useParams();
  const bootstrap = getApiDetailBootstrap();
  const session = useSession();
  const { data: api, isLoading, isError } = useAPI(slug, { initialData: bootstrap?.api });
  const { data: similarApis } = useSimilarAPIs(slug, { initialData: bootstrap?.similarApis });
  const rateAPI = useRateAPI();
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("curl");

  usePageMetadata({
    title: api ? api.name : "جزئیات API",
    description: api?.short_description || api?.description || "جزئیات فنی، پلن‌ها، مستندات و قرارداد دسترسی این API را بررسی کنید.",
    path: slug ? `/api/${slug}` : "/browse",
    type: "article",
    structuredData: api
      ? [
          createBreadcrumbSchema([
            { name: "خانه", path: "/" },
            { name: "مرور APIها", path: "/browse" },
            { name: api.name, path: `/api/${api.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: api.name,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            description: api.description || api.short_description,
            url: toSiteUrl(`/api/${api.slug}`),
            provider: {
              "@type": "Organization",
              name: SITE_NAME,
            },
            aggregateRating:
              api.rating_count > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: Number(api.rating),
                    reviewCount: api.rating_count,
                  }
                : undefined,
            offers:
              api.pricing_plans?.map((plan) => ({
                "@type": "Offer",
                price: Number(plan.price),
                priceCurrency: plan.currency,
                availability: plan.is_active ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
                name: plan.name,
              })) || undefined,
          },
        ]
      : undefined,
  });

  const languageSamples = useMemo(() => (api ? buildLanguageSamples(api) : []), [api]);
  const selectedSample = languageSamples.find((sample) => sample.id === selectedLanguage) || languageSamples[0];

  if (isLoading) {
    return (
      <div className="cyber-shell min-h-screen bg-background">
        <Navigation />
        <main id="main-content" className="container py-16">
          <Card className="h-80 animate-pulse bg-muted/60" />
        </main>
      </div>
    );
  }

  if (isError || !api) {
    return (
      <div className="cyber-shell min-h-screen bg-background">
        <Navigation />
        <main id="main-content" className="container py-16">
          <Card className="border-destructive/30">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-2xl font-bold">این API پیدا نشد</h1>
              <p className="text-muted-foreground">ممکن است شناسه URL اشتباه باشد یا سرویس از فهرست عمومی خارج شده باشد.</p>
              <Button asChild>
                <Link to="/browse">بازگشت به مرور APIها</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCopy = async () => {
    if (!selectedSample?.code || !navigator.clipboard) {
      toast.error("کپی در این مرورگر در دسترس نیست.");
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedSample.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      toast.success(`Access granted: نمونه ${selectedSample.label} کپی شد.`);
    } catch {
      toast.error("اجازه دسترسی به کلیپ‌بورد در این مرورگر در دسترس نیست.");
    }
  };

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="page-hero grid gap-8 lg:grid-cols-[1.25fr,0.75fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{api.category?.name || "عمومی"}</Badge>
              {api.is_featured ? <Badge>ویژه</Badge> : null}
              {api.is_popular ? <Badge variant="secondary">محبوب</Badge> : null}
              <ApiStatusBadge status={api.status} />
              <HealthSignalBadge />
              <AuthSchemeBadge scheme={api.rapidapi.public_auth_scheme} />
            </div>

            <div className="space-y-4">
              <h1 className="section-title">{api.name}</h1>
              <p className="section-copy">
                {api.description || api.short_description || "برای این API توضیحی ثبت نشده است."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="stat-chip">
                <Star className="h-4 w-4 text-primary" />
                امتیاز {api.rating}
              </span>
              <span className="stat-chip">
                <Eye className="h-4 w-4 text-primary" />
                {formatFaNumber(api.views_count)} بازدید
              </span>
              <span className="stat-chip">شروع قیمت: {formatCurrencyLabel(api.pricing_from)}</span>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="متدهای رایج API">
              <MethodBadge method="GET" />
              <MethodBadge method="POST" />
              <MethodBadge method="PATCH" />
            </div>

            <div className="flex flex-wrap gap-2">
              {api.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {api.base_url ? (
                <Button asChild>
                  <a href={api.base_url} target="_blank" rel="noreferrer" className="gap-2">
                    آدرس سرویس
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
              {api.documentation_url ? (
                <Button variant="outline" asChild>
                  <a href={api.documentation_url} target="_blank" rel="noreferrer">
                    مستندات مرجع
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle>خلاصه تصمیم‌گیری</CardTitle>
            </CardHeader>
            <CardContent className="content-list text-sm leading-7 text-muted-foreground">
              <div className="metric-card">
                <p className="mb-1 font-semibold text-foreground">روش دسترسی عمومی</p>
                <p>{accessSchemeLabels[api.rapidapi.public_auth_scheme] || "مدیریت‌شده در IranAPI"}</p>
              </div>
              <div className="metric-card">
                <p className="mb-1 font-semibold text-foreground">نسخه کانونی</p>
                <p>{api.rapidapi.canonical_version}</p>
              </div>
              <div className="metric-card">
                <p className="mb-1 font-semibold text-foreground">وضعیت انتشار</p>
                <p>{publicationStatusLabels[api.rapidapi.publication_status] || api.rapidapi.publication_status}</p>
              </div>
              <div className="space-y-3 rounded-md bg-muted/50 p-4">
                <p className="font-semibold text-foreground">امتیازدهی</p>
                <p>
                  {session.data?.authenticated
                    ? "اگر با این سرویس کار کرده‌اید، امتیاز شما به کیفیت پیشنهادها و رتبه‌بندی کمک می‌کند."
                    : "برای ثبت امتیاز ابتدا وارد حساب خود شوید."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => slug && rateAPI.mutate({ slug, rating: value })}
                      disabled={rateAPI.isPending}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="section-frame grid gap-8 lg:grid-cols-[1fr,1fr]">
          <Card className="surface-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>نمونه فراخوانی</CardTitle>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                {copied ? "کپی شد" : "کپی"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="زبان نمونه فراخوانی API">
                {languageSamples.map((sample) => (
                  <Button
                    key={sample.id}
                    type="button"
                    variant={selectedSample?.id === sample.id ? "default" : "outline"}
                    size="sm"
                    role="tab"
                    aria-selected={selectedSample?.id === sample.id}
                    onClick={() => {
                      setCopied(false);
                      setSelectedLanguage(sample.id);
                    }}
                  >
                    {sample.label}
                  </Button>
                ))}
              </div>
              <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                <code>{selectedSample?.code || "برای این API هنوز آدرس پایه ثبت نشده است."}</code>
              </pre>
              <p className="text-sm leading-7 text-muted-foreground">
                نمونه بالا برای مسیر دسترسی مدیریت‌شده IranAPI ساخته شده است. کلیدها را در محیط امن نگه دارید و فقط در
                زمان نیاز از داشبورد یا تنظیمات سرویس کپی کنید.
              </p>
              <SecurityNotice />
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle>پلن‌های قیمت‌گذاری</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {api.pricing_plans && api.pricing_plans.length > 0 ? (
                api.pricing_plans.map((plan) => (
                  <div key={plan.id} className="rounded-md border border-border/70 bg-background/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">{plan.plan_type}</p>
                      </div>
                      <Badge>{formatCurrencyLabel(plan.price, plan.currency)}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>درخواست روزانه: {plan.requests_per_day ? formatFaNumber(plan.requests_per_day) : "نامشخص"}</p>
                      <p>درخواست ماهانه: {plan.requests_per_month ? formatFaNumber(plan.requests_per_month) : "نامشخص"}</p>
                    </div>
                    {plan.features.length > 0 ? (
                      <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        {plan.features.map((feature) => (
                          <li key={feature}>• {feature}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">برای این سرویس هنوز پلن فعالی ثبت نشده است.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="section-frame grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                مستندات داخلی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {api.documentations && api.documentations.length > 0 ? (
                api.documentations.map((documentation) => (
                  <article key={documentation.slug} className="rounded-md border border-border/70 bg-background/70 p-5">
                    <h3 className="mb-3 text-lg font-semibold">{documentation.title}</h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{documentation.content}</p>
                  </article>
                ))
              ) : (
                <p className="text-muted-foreground">مستندات داخلی برای این API هنوز تکمیل نشده است.</p>
              )}
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle>سرویس‌های پیشنهادی مشابه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted/50 p-4 text-sm leading-7 text-muted-foreground">
                سرویس‌های مشابه بر اساس دسته‌بندی و برچسب‌ها پیشنهاد می‌شوند تا ارزیابی گزینه‌های جایگزین ساده‌تر شود.
              </div>

              {similarApis && similarApis.length > 0 ? (
                similarApis.map((item) => (
                  <div key={item.slug} className="rounded-md border border-border/70 bg-background/70 p-4">
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {item.short_description || "بدون توضیح کوتاه"}
                    </p>
                    <Button variant="link" className="px-0" asChild>
                      <Link to={`/api/${item.slug}`}>مشاهده جزئیات</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">برای این API مورد مشابهی پیدا نشد.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
