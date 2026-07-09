"use client";

import { useEffect, useState } from "react";

interface PromoBarProps {
  messages: string[];
}

const ROTATE_INTERVAL_MS = 5000;

/** Thin rotating promo ribbon above the main navigation. */
export function PromoBar({ messages }: PromoBarProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % messages.length),
      ROTATE_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="flex h-9 items-center justify-center bg-card px-4 text-center">
      <p
        key={index}
        className="animate-in fade-in text-xs text-foreground/80 duration-500"
      >
        {messages[index]}
      </p>
    </div>
  );
}
