import { Search } from "lucide-react";
import { FormEvent, startTransition, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ApiStatusBadge, AuthSchemeBadge, HealthSignalBadge, MethodBadge } from "@/components/ApiVaultBadges";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAPIs, useCategories } from "@/hooks/useApi";
import { getBrowseBootstrap } from "@/lib/bootstrap";
import { createBreadcrumbSchema, usePageMetadata } from "@/lib/metadata";
import { formatCurrencyLabel, formatFaNumber, toSiteUrl } from "@/lib/site";

const orderingOptions = [
  { label: "بیشترین امتیاز", value: "-rating" },
  { label: "بیشترین بازدید", value: "-views_count" },
  { label: "جدیدترین", value: "-created_at" },
  { label: "نام", value: "name" },
];

export default function Browse() {
  const bootstrap = getBrowseBootstrap();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page") || "1");
  const selectedCategory = searchParams.get("category") || "";
  const ordering = searchParams.get("ordering") || "-rating";
  const [searchValue, setSearchValue] = useState(initialSearch);
  const hasActiveFilters = Boolean(searchParams.get("search") || selectedCategory || ordering !== "-rating");

  const apiParams = useMemo(
    () => ({
      search: searchParams.get("search") || undefined,
      category: selectedCategory || undefined,
      ordering,
      page: currentPage,
    }),
    [currentPage, ordering, searchParams, selectedCategory],
  );

  const defaultBrowseData =
    currentPage === 1 && !selectedCategory && !searchParams.get("search") && ordering === "-rating"
      ? bootstrap?.apis
      : undefined;

  const { data: categories } = useCategories(undefined, { initialData: bootstrap?.categories });
  const { data: recommendedApis } = useAPIs(
    { featured: true, ordering: "-rating" },
    { initialData: bootstrap?.recommendedApis },
  );
  const { data: apis, isLoading, isError } = useAPIs(apiParams, { initialData: defaultBrowseData });
  const selectedCategoryLabel = categories?.results.find((category) => category.slug === selectedCategory)?.name;

  usePageMetadata({
    title: "مرور APIها",
    description: "فهرست زنده APIها را با جست‌وجو، دسته‌بندی و مرتب‌سازی مرور کنید و سریع‌تر به سرویس مناسب برسید.",
    path: "/browse",
    structuredData: [
      createBreadcrumbSchema([
        { name: "خانه", path: "/" },
        { name: "مرور APIها", path: "/browse" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "مرور APIها",
        url: toSiteUrl("/browse"),
        description: "فهرست زنده APIها با جست‌وجو، دسته‌بندی و مرتب‌سازی.",
        mainEntity: (apis?.results || []).slice(0, 10).map((api) => ({
          "@type": "SoftwareApplication",
          name: api.name,
          url: toSiteUrl(`/api/${api.slug}`),
          applicationCategory: "DeveloperApplication",
        })),
      },
    ],
  });

  const updateParams = (patch: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    if (!patch.page) {
      nextParams.delete("page");
    }
    startTransition(() => setSearchParams(nextParams));
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({
      search: searchValue.trim() || undefined,
      page: undefined,
    });
  };

  const totalPages = apis ? Math.max(1, Math.ceil(apis.count / 12)) : 1;

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="page-hero space-y-6">
          <div className="space-y-3">
            <p className="eyebrow">مرور و انتخاب</p>
            <h1 className="section-title">مرور APIها با فیلترهای واضح و نتایج قابل‌اقدام</h1>
            <p className="section-copy">
              نتیجه‌ها بر پایه دسته‌بندی، جست‌وجو و مرتب‌سازی ارائه می‌شوند تا مسیر انتخاب سرویس برای تیم‌های فنی
              کوتاه‌تر و دقیق‌تر شود.
            </p>
          </div>

          <Card className="glass-panel">
            <CardContent className="grid gap-4 p-6 lg:grid-cols-[1fr,220px,160px]">
              <form
                className="grid gap-4 lg:col-span-3 lg:grid-cols-[1fr,220px,160px]"
                onSubmit={handleSearch}
                role="search"
              >
                <div className="space-y-2">
                  <label htmlFor="browse-search" className="text-sm font-medium text-foreground">
                    جست‌وجوی API
                  </label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="browse-search"
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="مثلا پرداخت، نقشه، هوش مصنوعی"
                      className="pr-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="browse-ordering" className="text-sm font-medium text-foreground">
                    مرتب‌سازی
                  </label>
                  <select
                    id="browse-ordering"
                    value={ordering}
                    onChange={(event) => updateParams({ ordering: event.target.value, page: undefined })}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {orderingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button type="submit" className="w-full">
                    اعمال فیلتر
                  </Button>
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSearchValue("");
                        updateParams({
                          search: undefined,
                          category: undefined,
                          ordering: "-rating",
                          page: undefined,
                        });
                      }}
                    >
                      پاک کردن
                    </Button>
                  ) : null}
                </div>
              </form>

              <div className="lg:col-span-3 flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory ? "outline" : "default"}
                  size="sm"
                  onClick={() => updateParams({ category: undefined, page: undefined })}
                >
                  همه دسته‌ها
                </Button>
                {categories?.results.map((category) => (
                  <Button
                    key={category.slug}
                    variant={selectedCategory === category.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateParams({ category: category.slug, page: undefined })}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {!searchParams.get("search") && !selectedCategory ? (
          <section className="section-frame space-y-5">
            <div className="space-y-2">
              <p className="eyebrow">پیشنهاد برای شروع</p>
              <h2 className="text-2xl font-bold">سرویس‌های پیشنهادی برای ارزیابی اولیه</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(recommendedApis?.results || []).slice(0, 3).map((api) => (
                <Card key={api.slug} className="surface-card">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{api.category?.name || "عمومی"}</Badge>
                      <span className="text-sm text-muted-foreground">امتیاز {api.rating}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{api.name}</h3>
                      <p className="text-sm leading-7 text-muted-foreground">{api.short_description}</p>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/api/${api.slug}`}>مشاهده جزئیات</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section-frame space-y-6" aria-live="polite" aria-busy={isLoading}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">نتایج مرور</h2>
              <p className="text-sm text-muted-foreground">
                {apis ? `${formatFaNumber(apis.count)} نتیجه پیدا شد` : "در حال بارگذاری نتایج"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCategory ? <Badge variant="outline">دسته: {selectedCategoryLabel || selectedCategory}</Badge> : null}
              {searchParams.get("search") ? <Badge variant="outline">جست‌وجو: {searchParams.get("search")}</Badge> : null}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="h-60 animate-pulse bg-muted/60" />
              ))}
            </div>
          ) : isError ? (
            <Card className="border-destructive/30">
              <CardContent className="p-6 text-destructive">بارگذاری فهرست APIها با خطا مواجه شد.</CardContent>
            </Card>
          ) : apis && apis.results.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {apis.results.map((api) => (
                  <Card key={api.slug} className="surface-card">
                    <CardHeader className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="outline">{api.category?.name || "عمومی"}</Badge>
                        <div className="flex gap-2">
                          {api.is_featured ? <Badge>ویژه</Badge> : null}
                          {api.is_popular ? <Badge variant="secondary">محبوب</Badge> : null}
                        </div>
                      </div>
                      <CardTitle>{api.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="min-h-16 text-sm leading-7 text-muted-foreground">
                        {api.short_description || "برای این API توضیح کوتاهی ثبت نشده است."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <ApiStatusBadge status={api.status} />
                        <HealthSignalBadge />
                        <AuthSchemeBadge scheme={api.rapidapi.public_auth_scheme} />
                        <MethodBadge method="GET" />
                      </div>
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
                        <Link to={`/api/${api.slug}`}>مشاهده جزئیات</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  صفحه {formatFaNumber(currentPage)} از {formatFaNumber(totalPages)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => updateParams({ page: currentPage > 1 ? String(currentPage - 1) : undefined })}
                    disabled={currentPage <= 1}
                  >
                    قبلی
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateParams({ page: currentPage < totalPages ? String(currentPage + 1) : String(currentPage) })
                    }
                    disabled={currentPage >= totalPages}
                  >
                    بعدی
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="space-y-3 p-8 text-center">
                <h2 className="text-xl font-semibold">موردی پیدا نشد</h2>
                <p className="text-muted-foreground">فیلترها را تغییر دهید یا عبارت دیگری را جست‌وجو کنید.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
