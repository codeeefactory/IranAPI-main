import { Search, Sparkles, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated mesh background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="API Network Visualization" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute inset-0 opacity-30" style={{ background: 'var(--gradient-mesh)' }} />
      </div>

      <div className="cyber-grid" aria-hidden="true" />

      {/* Content */}
      <div className="container relative z-10 px-4 py-32">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Badge */}
          <div className="flex justify-center animate-fade-in-down">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 backdrop-blur-xl transition-all duration-500 hover:shadow-glow-primary">
              <Sparkles className="h-4 w-4 text-primary animate-pulse-glow" />
              <span className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                پلتفرم IranAPI • تجربه بازار API با الهام از RapidAPI
              </span>
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center space-y-6 animate-fade-in-up [animation-delay:200ms]">
            <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tight">
              <span className="block text-foreground">دنیای بی‌پایان</span>
              <span className="block mt-4 bg-gradient-primary bg-clip-text text-transparent animate-glow">
                APIهای آماده
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              یکپارچه‌سازی سریع، مستندات روشن و اتصال قابل پیگیری به سرویس‌های مورد نیاز محصول شما.
              <span className="text-primary font-semibold"> دقایقی تا راه‌اندازی فاصله دارید.</span>
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-3xl mx-auto animate-scale-in [animation-delay:400ms]">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-md bg-gradient-primary opacity-20 blur-md transition-opacity duration-500 group-hover:opacity-35" />
              <div className="relative flex items-center gap-2 rounded-md border border-primary/20 bg-card p-2 shadow-card backdrop-blur-xl transition-all duration-500 hover:shadow-card-hover">
                <div className="flex items-center gap-3 flex-1 px-4">
                  <Search className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <Input 
                    placeholder="جستجوی APIها... (مثلاً: پرداخت، هوش مصنوعی، اس‌ام‌اس)"
                    className="h-14 border-0 bg-transparent text-lg focus-visible:ring-0 placeholder:text-muted-foreground"
                  />
                </div>
                <Button 
                  size="lg"
                  className="h-14 px-8 bg-gradient-primary font-bold transition-all duration-300 hover:shadow-glow-primary"
                >
                  جستجو
                </Button>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8 animate-fade-in [animation-delay:600ms]">
            <div className="surface-card group relative overflow-hidden border-primary/20 p-8 hover:shadow-glow-primary">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary group-hover:animate-bounce-gentle" />
                  <div className="text-4xl font-black bg-gradient-primary bg-clip-text text-transparent">
                    زنده
                  </div>
                </div>
                <div className="text-sm font-semibold text-muted-foreground">کاتالوگ IranAPI</div>
              </div>
            </div>

            <div className="surface-card group relative overflow-hidden border-secondary/20 p-8 hover:shadow-glow-secondary">
              <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-secondary group-hover:animate-bounce-gentle" />
                  <div className="text-4xl font-black bg-gradient-secondary bg-clip-text text-transparent">
                    تیمی
                  </div>
                </div>
                <div className="text-sm font-semibold text-muted-foreground">داشبورد مشترک</div>
              </div>
            </div>

            <div className="surface-card group relative overflow-hidden border-accent/20 p-8 hover:shadow-glow-accent">
              <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-accent group-hover:animate-bounce-gentle" />
                  <div className="text-4xl font-black bg-gradient-accent bg-clip-text text-transparent">
                    ۹۹.۹٪
                  </div>
                </div>
                <div className="text-sm font-semibold text-muted-foreground">آپتایم</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
