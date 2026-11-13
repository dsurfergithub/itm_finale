import { useEffect, useRef, type ReactNode } from "react";
export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      !("IntersectionObserver" in window) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "reduced"
    )
      return;
    el.dataset.reveal = "waiting";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          delete el.dataset.reveal;
          el.classList.add("animate__animated", "animate__fadeInUp");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      delete el.dataset.reveal;
    };
  }, []);
  return <div ref={ref}>{children}</div>;
}
