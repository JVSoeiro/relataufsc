"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  formatter: (value: number) => string;
  className?: string;
};

export function AnimatedCounter({
  value,
  formatter,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValueRef = useRef(0);

  useEffect(() => {
    const controls = animate(currentValueRef.current, value, {
      duration: 1.25,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        currentValueRef.current = latest;
        setDisplayValue(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [value]);

  return (
    <p aria-live="polite" className={className}>
      {formatter(displayValue)}
    </p>
  );
}
