import { Link } from "react-router-dom";
import { Activity, CircuitBoard, RadioTower } from "lucide-react";

const primaryLinks = [
  { label: "مرور APIها", to: "/browse" },
  { label: "مستندات", to: "/documentation" },
  { label: "قیمت‌گذاری", to: "/pricing" },
];

const policyLinks = [
  { label: "شرایط استفاده", to: "/terms" },
  { label: "حریم خصوصی", to: "/privacy" },
];

export function Footer() {
  return (
    <footer className="footer-console border-t border-border/70 bg-background/75">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.4fr,0.8fr,0.8fr]">
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-display text-lg font-black text-foreground">
            <CircuitBoard className="h-5 w-5 text-primary" />
            IranAPI
          </p>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            یک کنسول توسعه‌دهنده برای کشف API، مقایسه پلن‌ها، خواندن مستندات، پایش دسترسی و حرکت امن از ایده تا اتصال.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="stat-chip">
              <RadioTower className="h-4 w-4 text-accent" />
              v1 live
            </span>
            <span className="stat-chip">
              <Activity className="h-4 w-4 text-accent" />
              telemetry ready
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">مسیرهای اصلی</p>
          <div className="grid gap-2 text-sm">
            {primaryLinks.map((link) => (
              <Link key={link.to} to={link.to} className="link-fade">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">اعتماد و سیاست‌ها</p>
          <div className="grid gap-2 text-sm">
            {policyLinks.map((link) => (
              <Link key={link.to} to={link.to} className="link-fade">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
