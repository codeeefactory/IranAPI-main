import { ArrowRight, Check, Code2, Copy, PlusCircle, RadioTower, Save, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { SecretPreview, SecurityNotice } from "@/components/ApiVaultBadges";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccessGrants, useCurrentUser, useProfile, useUpdateProfile, useUpdateUser, useUsage, useUsageStats } from "@/hooks/useApi";
import { usePageMetadata } from "@/lib/metadata";
import { formatDateTimeFa } from "@/lib/site";

const apiDraftStorageKey = "iranapi-dashboard-api-drafts";

const defaultApiForm = {
  name: "",
  baseUrl: "",
  documentationUrl: "",
  authScheme: "api-key",
  category: "",
  tags: "",
  description: "",
};

interface ApiDraft {
  id: string;
  name: string;
  baseUrl: string;
  documentationUrl: string;
  authScheme: string;
  category: string;
  tags: string[];
  description: string;
  owner: string;
  createdAt: string;
}

const readStoredApiDrafts = (): ApiDraft[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedDrafts = window.localStorage.getItem(apiDraftStorageKey);
    if (!storedDrafts) {
      return [];
    }

    const parsed = JSON.parse(storedDrafts);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
};

export default function Dashboard() {
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();
  const { data: accessGrants } = useAccessGrants();
  const { data: usage } = useUsage();
  const { data: usageStats } = useUsageStats();
  const updateUser = useUpdateUser();
  const updateProfile = useUpdateProfile();

  usePageMetadata({
    title: "داشبورد توسعه‌دهنده",
    description: "حساب کاربری، دسترسی‌های فعال، داده‌های مصرف و مشخصات توسعه‌دهنده خود را در داشبورد IranAPI مدیریت کنید.",
    path: "/dashboard",
    noindex: true,
  });

  const [accountForm, setAccountForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [profileForm, setProfileForm] = useState({
    phone: "",
    company: "",
    bio: "",
    avatar: "",
  });
  const [apiForm, setApiForm] = useState(defaultApiForm);
  const [apiDrafts, setApiDrafts] = useState<ApiDraft[]>(readStoredApiDrafts);
  const [manifestCopied, setManifestCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setAccountForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        phone: profile.phone || "",
        company: profile.company || "",
        bio: profile.bio || "",
        avatar: profile.avatar || "",
      });
    }
  }, [profile]);

  const apiTags = useMemo(
    () =>
      apiForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [apiForm.tags],
  );

  const apiManifest = useMemo(
    () =>
      JSON.stringify(
        {
          name: apiForm.name.trim() || "<API_NAME>",
          base_url: apiForm.baseUrl.trim() || "https://api.example.com/v1",
          documentation_url: apiForm.documentationUrl.trim() || "",
          auth_scheme: apiForm.authScheme,
          category: apiForm.category.trim() || "uncategorized",
          tags: apiTags.length ? apiTags : ["developer-tool"],
          owner: user?.username || user?.email || "current-user",
          status: "draft",
          secret_policy: "Never paste live API keys, tokens, or secrets into this draft.",
        },
        null,
        2,
      ),
    [apiForm, apiTags, user?.email, user?.username],
  );

  const saveApiDrafts = (drafts: ApiDraft[]) => {
    setApiDrafts(drafts);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(apiDraftStorageKey, JSON.stringify(drafts));
    }
  };

  const handleAccountSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await updateUser.mutateAsync(accountForm);
  };

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await updateProfile.mutateAsync({
      ...profileForm,
      avatar: profileForm.avatar.trim() || null,
    });
  };

  const handleApiDraftSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextDraft: ApiDraft = {
      id: `${Date.now()}`,
      name: apiForm.name.trim(),
      baseUrl: apiForm.baseUrl.trim(),
      documentationUrl: apiForm.documentationUrl.trim(),
      authScheme: apiForm.authScheme,
      category: apiForm.category.trim(),
      tags: apiTags,
      description: apiForm.description.trim(),
      owner: user?.username || user?.email || "developer",
      createdAt: new Date().toISOString(),
    };

    saveApiDrafts([nextDraft, ...apiDrafts].slice(0, 5));
    setApiForm(defaultApiForm);
    setManifestCopied(false);
    toast.success("پیشنهاد API در داشبورد ذخیره شد.");
  };

  const handleCopyManifest = async () => {
    try {
      await navigator.clipboard.writeText(apiManifest);
      setManifestCopied(true);
      toast.success("Manifest API کپی شد.");
    } catch {
      toast.error("کپی خودکار در این مرورگر فعال نیست.");
    }
  };

  const activeAccess = accessGrants?.results.find((grant) => grant.status === "active");
  const recommendedSlug = usageStats?.top_apis?.[0]?.slug || accessGrants?.results[0]?.api.slug;
  const recommendedName = usageStats?.top_apis?.[0]?.name || accessGrants?.results[0]?.api.name;

  return (
    <div className="cyber-shell min-h-screen bg-background">
      <Navigation />

      <main id="main-content" className="container page-stack">
        <section className="page-hero grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="eyebrow">Developer Portal</p>
              <h1 className="section-title">داشبورد {user?.first_name || user?.username || "توسعه‌دهنده"}</h1>
              <p className="section-copy">
                این ناحیه برای مدیریت حساب، پروفایل، دسترسی‌های ثبت‌شده، کلیدهای امن و وضعیت مصرف ساخته شده است. فعال‌سازی دسترسی API از مسیر مستقل IranAPI انجام می‌شود.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="stat-chip">دسترسی فعال: {(accessGrants?.results.length || 0).toLocaleString("fa-IR")}</span>
              <span className="stat-chip">درخواست ثبت‌شده: {(usageStats?.total_requests || 0).toLocaleString("fa-IR")}</span>
              <span className="stat-chip">ایمیل: {user?.email || "ثبت نشده"}</span>
            </div>
          </div>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle>اقدام‌های سریع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div className="metric-card">
                <p className="mb-2 font-semibold text-foreground">پیشنهاد بعدی</p>
                <p>{recommendedName ? `بیشترین استفاده فعلی شما روی ${recommendedName} ثبت شده است.` : "اگر هنوز سرویس فعالی ندارید، از فهرست APIها شروع کنید و پلن مناسب را از مرکز قیمت‌گذاری IranAPI بررسی کنید."}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/browse" className="gap-2">
                    مرور APIها
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/pricing">بررسی قیمت‌گذاری</Link>
                </Button>
              </div>
              {recommendedSlug ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/api/${recommendedSlug}`}>مشاهده سرویس پیشنهادی</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          <Card className="surface-card border-border/60">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">کل درخواست‌ها</p>
              <p className="text-3xl font-bold">{(usageStats?.total_requests || 0).toLocaleString("fa-IR")}</p>
            </CardContent>
          </Card>
          <Card className="surface-card border-border/60">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">APIهای فعال</p>
              <p className="text-3xl font-bold">{(usageStats?.active_apis || 0).toLocaleString("fa-IR")}</p>
            </CardContent>
          </Card>
          <Card className="surface-card border-border/60">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">دسترسی‌های ثبت‌شده</p>
              <p className="text-3xl font-bold">{(accessGrants?.results.length || 0).toLocaleString("fa-IR")}</p>
            </CardContent>
          </Card>
          <Card className="surface-card border-border/60">
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">ایمیل حساب</p>
              <p className="truncate text-lg font-semibold">{user?.email || "ثبت نشده"}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                افزودن API به خزانه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleApiDraftSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="api-name">نام API</Label>
                    <Input
                      id="api-name"
                      required
                      value={apiForm.name}
                      placeholder="Speech Gateway"
                      onChange={(event) => setApiForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-base-url">Base URL</Label>
                    <Input
                      id="api-base-url"
                      required
                      dir="ltr"
                      type="url"
                      value={apiForm.baseUrl}
                      placeholder="https://api.example.com/v1"
                      onChange={(event) => setApiForm((current) => ({ ...current, baseUrl: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="api-docs">لینک مستندات</Label>
                    <Input
                      id="api-docs"
                      dir="ltr"
                      type="url"
                      value={apiForm.documentationUrl}
                      placeholder="https://docs.example.com"
                      onChange={(event) => setApiForm((current) => ({ ...current, documentationUrl: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-auth">روش احراز هویت</Label>
                    <select
                      id="api-auth"
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={apiForm.authScheme}
                      onChange={(event) => setApiForm((current) => ({ ...current, authScheme: event.target.value }))}
                    >
                      <option value="api-key">API Key</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="oauth2">OAuth 2.0</option>
                      <option value="basic">Basic Auth</option>
                      <option value="none">No Auth</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="api-category">دسته‌بندی</Label>
                    <Input
                      id="api-category"
                      value={apiForm.category}
                      placeholder="AI, Finance, Messaging"
                      onChange={(event) => setApiForm((current) => ({ ...current, category: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-tags">تگ‌ها</Label>
                    <Input
                      id="api-tags"
                      value={apiForm.tags}
                      placeholder="sms, webhook, realtime"
                      onChange={(event) => setApiForm((current) => ({ ...current, tags: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-description">توضیح کوتاه</Label>
                  <Textarea
                    id="api-description"
                    required
                    rows={4}
                    value={apiForm.description}
                    placeholder="این API چه مسئله‌ای را برای توسعه‌دهنده حل می‌کند؟"
                    onChange={(event) => setApiForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </div>

                <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-7 text-muted-foreground">
                  کلید واقعی، توکن، secret یا credential تولیدی را اینجا وارد نکنید. این بخش فقط metadata امن API را برای بررسی و ثبت در خزانه آماده می‌کند.
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    ذخیره پیش‌نویس API
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={handleCopyManifest}>
                    {manifestCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    کپی Manifest
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                پیش‌نمایش ثبت API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="max-h-72 overflow-auto rounded-md border border-border/60 bg-black/40 p-4 text-left text-xs leading-6 text-cyan-100" dir="ltr">
                <code>{apiManifest}</code>
              </pre>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">پیش‌نویس‌های اخیر</p>
                {apiDrafts.length > 0 ? (
                  apiDrafts.map((draft) => (
                    <div key={draft.id} className="rounded-md border border-border/60 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-semibold">{draft.name}</p>
                        <Badge variant="secondary">{draft.authScheme}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground" dir="ltr">
                        {draft.baseUrl}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(draft.tags.length ? draft.tags : ["draft"]).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state text-sm leading-7 text-muted-foreground">
                    هنوز API جدیدی آماده نشده است. اولین metadata امن را ثبت کنید تا داشبورد آن را مثل یک ورودی تازه در صف بررسی نگه دارد.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <Card className="surface-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RadioTower className="h-5 w-5 text-primary" />
                دسترسی و اشتراک
              </CardTitle>
              <Button variant="outline" asChild>
                <Link to="/pricing">مرور پلن‌ها</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted/40 p-4 text-sm leading-7 text-muted-foreground">
                IranAPI برای دسترسی تولیدی به APIها از مدل دسترسی مدیریت‌شده داخلی استفاده می‌کند. اگر پلنی هنوز در حساب شما فعال نشده، از بخش قیمت‌گذاری وارد مسیر فعال‌سازی همان سرویس شوید.
              </div>
              <SecretPreview value={profile?.api_key_preview || profile?.api_key} hasSecret={profile?.has_api_key} />
              <SecurityNotice />

              {activeAccess ? (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">
                  <p className="mb-1 font-semibold text-foreground">وضعیت فعلی</p>
                  <p>
                    اشتراک فعال شما برای {activeAccess.api.name} ثبت شده و سقف روزانه آن {activeAccess.requests_per_day?.toLocaleString("fa-IR") || "نامشخص"} درخواست است.
                  </p>
                </div>
              ) : null}

              {accessGrants?.results && accessGrants.results.length > 0 ? (
                accessGrants.results.map((grant) => (
                  <div key={grant.id} className="rounded-md border border-border/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{grant.api.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {grant.pricing_plan?.name || "بدون پلن متصل"} • {grant.source}
                        </p>
                      </div>
                      <Badge variant={grant.status === "active" ? "default" : "secondary"}>{grant.status}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>سقف روزانه: {grant.requests_per_day?.toLocaleString("fa-IR") || "نامشخص"}</p>
                      <p>سقف ماهانه: {grant.requests_per_month?.toLocaleString("fa-IR") || "نامشخص"}</p>
                    </div>
                    <Button variant="link" className="mt-2 px-0" asChild>
                      <Link to={`/api/${grant.api.slug}`}>مدیریت سرویس در IranAPI</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="empty-state text-sm leading-7 text-muted-foreground">
                  هنوز دسترسی فعالی برای این حساب ثبت نشده است. از بخش قیمت‌گذاری یک API را انتخاب کنید و دسترسی آن را در IranAPI فعال کنید.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                پیشنهاد و مصرف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageStats?.top_apis && usageStats.top_apis.length > 0 ? (
                usageStats.top_apis.map((item) => (
                  <div key={item.slug} className="rounded-md border border-border/60 p-4">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="font-semibold">{item.name}</p>
                      <Badge variant="secondary">{item.requests_count.toLocaleString("fa-IR")} درخواست</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.slug}</p>
                    <Button variant="link" className="mt-2 px-0" asChild>
                      <Link to={`/api/${item.slug}`}>بررسی جزئیات سرویس</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">هنوز داده مصرفی معناداری برای این حساب ثبت نشده است.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                اطلاعات حساب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAccountSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">نام</Label>
                    <Input
                      id="first_name"
                      value={accountForm.first_name}
                      onChange={(event) => setAccountForm((current) => ({ ...current, first_name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">نام خانوادگی</Label>
                    <Input
                      id="last_name"
                      value={accountForm.last_name}
                      onChange={(event) => setAccountForm((current) => ({ ...current, last_name: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={accountForm.email}
                    onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <Button type="submit" className="gap-2" disabled={updateUser.isPending}>
                  <Save className="h-4 w-4" />
                  ذخیره اطلاعات حساب
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle>پروفایل توسعه‌دهنده</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">شماره تماس</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">شرکت</Label>
                    <Input
                      id="company"
                      value={profileForm.company}
                      onChange={(event) => setProfileForm((current) => ({ ...current, company: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">آدرس تصویر پروفایل</Label>
                  <Input
                    id="avatar"
                    value={profileForm.avatar}
                    onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">بیو</Label>
                  <Textarea
                    id="bio"
                    rows={5}
                    value={profileForm.bio}
                    onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                  />
                </div>
                <Button type="submit" className="gap-2" disabled={updateProfile.isPending}>
                  <Save className="h-4 w-4" />
                  ذخیره پروفایل
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle>سوابق مصرف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage?.results && usage.results.length > 0 ? (
              usage.results.map((item) => (
                <div key={item.id} className="rounded-md border border-border/60 p-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="font-semibold">{item.api.name}</p>
                    <Badge variant="outline">{item.requests_count.toLocaleString("fa-IR")} درخواست</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    منبع ثبت: {item.source} • آخرین استفاده: {formatDateTimeFa(item.last_used)}
                  </p>
                  <Button variant="link" className="mt-2 px-0" asChild>
                    <Link to={`/api/${item.api.slug}`}>مدیریت سرویس در IranAPI</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">هنوز سابقه‌ای برای این حساب وجود ندارد.</p>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
