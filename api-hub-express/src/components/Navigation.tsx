import { CircuitBoard, LayoutDashboard, LogOut, MenuSquare } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useLogout, useSession } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "خانه", to: "/" },
  { label: "مرور APIها", to: "/browse" },
  { label: "مستندات", to: "/documentation" },
  { label: "قیمت‌گذاری", to: "/pricing" },
];

export function Navigation() {
  const navigate = useNavigate();
  const session = useSession();
  const logout = useLogout();

  const handleLogout = async () => {
    navigate("/", { replace: true });
    await logout.mutateAsync();
  };

  return (
    <header className="nav-console sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="container flex flex-col gap-4 py-3 sm:py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link to="/" className="group flex min-w-0 items-center gap-3 rounded-md">
              <span className="brand-sigil">
                <CircuitBoard className="h-5 w-5" />
              </span>
              <div className="min-w-0 space-y-1">
                <div className="glitch-text font-display text-lg font-black tracking-tight text-foreground">IranAPI</div>
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground sm:line-clamp-1">کنسول فارسی API، مستندات و عملیات توسعه</p>
              </div>
            </Link>

            <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-foreground",
                      isActive && "border border-primary/25 bg-primary/15 text-foreground shadow-glow-primary",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-[auto,1fr,1fr] items-center gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-3">
            <ThemeToggle />

            {session.data?.authenticated ? (
              <>
                <Button variant="outline" className="min-w-0" asChild>
                  <Link to="/dashboard" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="truncate">{session.data.user?.username || "داشبورد"}</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="gap-2" onClick={handleLogout} disabled={logout.isPending}>
                  <LogOut className="h-4 w-4" />
                  خروج
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="w-full sm:w-auto" asChild>
                  <Link to="/signin">ورود</Link>
                </Button>
                <Button className="w-full sm:w-auto" asChild>
                  <Link to="/signup">ساخت حساب</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <nav aria-label="ناوبری موبایل" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
          <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <MenuSquare className="h-3.5 w-3.5" />
            مسیرها
          </span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground",
                  isActive && "border-primary/50 bg-primary/15 text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
