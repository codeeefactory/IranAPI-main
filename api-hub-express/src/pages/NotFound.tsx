import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { usePageMetadata } from "@/lib/metadata";

export default function NotFound() {
  usePageMetadata({
    title: "صفحه یافت نشد",
    description: "این مسیر در IranAPI وجود ندارد یا جابه‌جا شده است. از این صفحه به خانه یا فهرست APIها برگردید.",
    noindex: true,
  });

  return (
    <main id="main-content" className="cyber-shell container flex min-h-screen items-center justify-center py-16">
      <div className="page-hero w-full max-w-xl space-y-5 text-center">
        <p className="eyebrow">404</p>
        <h1 className="section-title">صفحه مورد نظر پیدا نشد</h1>
        <p className="mx-auto max-w-lg text-muted-foreground">
          مسیر واردشده وجود ندارد یا به آدرس دیگری منتقل شده است. از صفحه اصلی یا فهرست APIها ادامه دهید.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to="/">خانه</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/browse">کشف APIها</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
