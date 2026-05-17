import { useEffect, useRef, useState } from "react";

const interactiveSelector = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "[role='button']",
  "[data-radix-collection-item]",
  ".surface-card",
].join(",");

export function CyberCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(supportsFinePointer && !reducedMotion);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    document.documentElement.classList.add("cyber-cursor-enabled");

    let frame = 0;
    const move = (event: PointerEvent) => {
      target.current = { x: event.clientX, y: event.clientY };
    };

    const pointerDown = () => {
      cursorRef.current?.classList.add("is-clicking");
      window.setTimeout(() => cursorRef.current?.classList.remove("is-clicking"), 180);
    };

    const pointerOver = (event: PointerEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      const isInteractive = Boolean(element?.closest(interactiveSelector));
      document.documentElement.classList.toggle("cyber-cursor-interactive", isInteractive);
    };

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.22;
      current.current.y += (target.current.y - current.current.y) * 0.22;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0)`;
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      }
      frame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", pointerDown, { passive: true });
    window.addEventListener("pointerover", pointerOver, { passive: true });
    frame = window.requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove("cyber-cursor-enabled", "cyber-cursor-interactive");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointerover", pointerOver);
      window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div ref={haloRef} className="cyber-cursor-halo" aria-hidden="true" />
      <div ref={cursorRef} className="cyber-cursor-dot" aria-hidden="true" />
    </>
  );
}
