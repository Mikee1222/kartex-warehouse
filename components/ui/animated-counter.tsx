"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  className?: string;
  durationMs?: number;
};

export function AnimatedCounter({
  value,
  className,
  durationMs = 700,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const start = performance.now();

    function frame(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(frame);
      else fromRef.current = to;
    }

    requestAnimationFrame(frame);
  }, [value, durationMs]);

  return <span className={className}>{display}</span>;
}
