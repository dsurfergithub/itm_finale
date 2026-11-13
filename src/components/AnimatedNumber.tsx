import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
export function AnimatedNumber({
  value,
  enabled = true,
}: {
  value: number;
  enabled?: boolean;
}) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!enabled || reduce || from.current === value) {
      setDisplay(value);
      from.current = value;
      return;
    }
    let frame = 0;
    const started = performance.now();
    const initial = from.current;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 500);
      const next = Math.round(
        initial + (value - initial) * (1 - Math.pow(1 - progress, 3)),
      );
      setDisplay(next);
      from.current = next;
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, enabled, reduce]);
  return (
    <span aria-label={value.toLocaleString("es-ES")}>
      <span aria-hidden="true">{display.toLocaleString("es-ES")}</span>
    </span>
  );
}
