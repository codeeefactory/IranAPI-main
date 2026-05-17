import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CyberCursor } from "@/components/CyberCursor";
import { AOSProvider } from "@/components/AOSProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Index from "@/pages/Index";

const Browse = lazy(() => import("@/pages/Browse"));
const ApiDetails = lazy(() => import("@/pages/ApiDetails"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Payment = lazy(() => import("@/pages/Payment"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 60_000,
    },
  },
});

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return null;
}

function RouteFallback() {
  return (
    <main id="main-content" className="container py-16">
      <div className="grid gap-6" aria-label="در حال بارگذاری مسیر">
        <div className="doc-skeleton h-10 w-48" />
        <div className="doc-skeleton h-32" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="doc-skeleton h-48" />
          <div className="doc-skeleton h-48" />
          <div className="doc-skeleton h-48" />
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="iranapi-theme">
        <Sonner position="top-center" />
        <BrowserRouter>
          <div dir="rtl" className="min-h-screen">
            <CyberCursor />
            <LoadingScreen />
            <AOSProvider />
            <a href="#main-content" className="skip-link">
              پرش به محتوای اصلی
            </a>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/api/:slug" element={<ApiDetails />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
