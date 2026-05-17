import { useEffect, useState } from "react";

const bootSteps = ["INIT ROUTER", "SCAN API VAULT", "MASK SECRETS", "ARM UI"];
const bootQuips = [
  "کلیدها پشت شیشه ضدکنجکاوی قفل شدند.",
  "Endpointها مرتب شدند؛ یکی هم قهوه خواست.",
  "داشبورد در حالت نئون کم‌مصرف گرم شد.",
];

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, 320);

    return () => window.clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="boot-screen" role="status" aria-live="polite" aria-label="در حال آماده‌سازی IranAPI">
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-card">
        <div className="terminal-topbar">
          <span />
          <span />
          <span />
          <p>iranapi://boot-sequence</p>
        </div>

        <div className="grid gap-6 p-6">
          <div className="space-y-2 text-center">
            <p className="cyber-kicker mx-auto w-fit">Developer Ops Console</p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">IranAPI</h2>
            <p className="text-sm text-muted-foreground">همگام‌سازی مستندات، بازار API و داشبورد توسعه‌دهنده</p>
          </div>

          <div className="boot-core" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="grid gap-2">
            {bootSteps.map((step, index) => (
              <div key={step} className="boot-step" style={{ animationDelay: `${index * 120}ms` }}>
                <code>{step}</code>
                <strong>OK</strong>
              </div>
            ))}
          </div>

          <div className="boot-progress" aria-hidden="true">
            <span />
          </div>
          <p className="text-center text-xs text-muted-foreground">{bootQuips[new Date().getSeconds() % bootQuips.length]}</p>
        </div>
      </div>
    </div>
  );
};
