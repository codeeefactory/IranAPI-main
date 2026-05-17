import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useSession } from "@/hooks/useApi";


interface ProtectedRouteProps {
  children: ReactNode;
}


export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const session = useSession();

  if (session.isLoading) {
    return (
      <div className="container py-24" role="status" aria-live="polite">
        <div className="mx-auto grid max-w-lg gap-4 rounded-md border border-primary/20 bg-card/90 p-6 text-center shadow-card">
          <span className="cyber-kicker mx-auto">Scanning session</span>
          <div className="doc-skeleton h-3" aria-hidden="true" />
          <p className="text-muted-foreground">در حال بررسی هویت شما و قفل‌های داشبورد...</p>
        </div>
      </div>
    );
  }

  if (!session.data?.authenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
