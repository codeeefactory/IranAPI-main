import { useEffect } from "react";

const animatedSelector = [
  "[data-aos]",
  ".page-hero",
  ".surface-card",
  ".metric-card",
  ".doc-record",
  ".signal-tile",
  ".stat-chip",
  ".docs-control-deck",
].join(",");

const visibleClassName = "aos-visible";

export function AOSProvider() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const registeredElements = new WeakSet<Element>();
    const revealTimers = new Set<number>();

    const reveal = (element: Element) => {
      element.classList.add(visibleClassName);
    };

    let observer: IntersectionObserver | null = null;

    if (!reducedMotion && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            reveal(entry.target);
            observer?.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
    }

    const registerAnimatedElements = () => {
      document.querySelectorAll(animatedSelector).forEach((element, index) => {
        if (registeredElements.has(element)) {
          return;
        }

        registeredElements.add(element);

        if (element instanceof HTMLElement) {
          element.style.setProperty("--aos-delay", `${Math.min(index % 8, 6) * 45}ms`);
        }

        if (!observer) {
          reveal(element);
          return;
        }

        observer.observe(element);

        const timer = window.setTimeout(() => {
          reveal(element);
          observer?.unobserve(element);
          revealTimers.delete(timer);
        }, 900);
        revealTimers.add(timer);
      });
    };

    registerAnimatedElements();

    const mutationObserver = new MutationObserver(registerAnimatedElements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer?.disconnect();
      revealTimers.forEach((timer) => window.clearTimeout(timer));
      revealTimers.clear();
    };
  }, []);

  return null;
}
