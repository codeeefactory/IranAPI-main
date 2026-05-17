import { Chrome, Github, Linkedin, Lock, Mail, Network } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSocialAuthProviders } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

const providerIcons = {
  google: Chrome,
  github: Github,
  microsoft: Mail,
  linkedin: Linkedin,
} as const;

const providerTone: Record<string, string> = {
  google: "hover:border-cyber-yellow/70 hover:text-cyber-yellow",
  github: "hover:border-primary/70 hover:text-primary",
  microsoft: "hover:border-cyber-green/70 hover:text-cyber-green",
  linkedin: "hover:border-blue-400/70 hover:text-blue-300",
};

interface SocialAuthPanelProps {
  mode: "signin" | "signup";
}

export function SocialAuthPanel({ mode }: SocialAuthPanelProps) {
  const { data, isLoading } = useSocialAuthProviders();
  const providers = data?.providers?.length ? data.providers : [
    { slug: "google", label: "Google", enabled: false, start_url: "/api/v1/auth/social/google/start/" },
    { slug: "github", label: "GitHub", enabled: false, start_url: "/api/v1/auth/social/github/start/" },
    { slug: "microsoft", label: "Microsoft", enabled: false, start_url: "/api/v1/auth/social/microsoft/start/" },
    { slug: "linkedin", label: "LinkedIn", enabled: false, start_url: "/api/v1/auth/social/linkedin/start/" },
  ];
  const hasEnabledProvider = providers.some((provider) => provider.enabled);

  return (
    <div className="space-y-4" aria-busy={isLoading}>
      <div className="relative flex items-center gap-3 text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
        <span className="h-px flex-1 bg-border/70" />
        <span>{mode === "signin" ? "ورود سریع شبکه‌ای" : "ثبت‌نام سریع شبکه‌ای"}</span>
        <span className="h-px flex-1 bg-border/70" />
      </div>

      {!isLoading && !hasEnabledProvider ? (
        <div className="rounded-md border border-cyber-yellow/30 bg-cyber-yellow/10 px-4 py-3 text-sm leading-7 text-muted-foreground" role="note">
          OAuth در این محیط هنوز تنظیم نشده است. برای تست ورود و ثبت‌نام از نام کاربری و رمز عبور استفاده کنید.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => {
          const Icon = providerIcons[provider.slug as keyof typeof providerIcons] || Network;
          const label = provider.label || provider.slug;
          return provider.enabled ? (
            <Button
              key={provider.slug}
              asChild
              variant="social"
              className={cn("justify-start", providerTone[provider.slug])}
            >
              <a href={provider.start_url} aria-label={`${mode === "signin" ? "ورود" : "ثبت‌نام"} با ${label}`}>
                <Icon className="h-4 w-4" />
                {label}
              </a>
            </Button>
          ) : (
            <Button
              key={provider.slug}
              type="button"
              variant="social"
              disabled
              aria-disabled="true"
              className={cn("justify-start", providerTone[provider.slug])}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className="ms-auto inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                <Lock className="h-3 w-3" />
                تنظیم نشده
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
