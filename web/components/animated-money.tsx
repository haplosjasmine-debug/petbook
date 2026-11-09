"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/utils";

function AnimatedValue({
  value,
  format,
  className,
}: {
  value: number;
  format: (value: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previous.current = value;
      mounted.current = true;
      setDisplay(value);
      return;
    }

    const from = mounted.current ? previous.current : 0;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 700, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        previous.current = value;
      }
    };

    mounted.current = true;
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{format(display)}</span>;
}

export function AnimatedMoney({ value, className }: { value: number; className?: string }) {
  return <AnimatedValue value={value} format={formatMoney} className={className} />;
}

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return (
    <AnimatedValue
      value={value}
      format={(number) => Math.round(number).toLocaleString("en-PH")}
      className={className}
    />
  );
}
