"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyzing your dietary preferences…",
  "Searching for matching recipes…",
  "Building your 7-day plan…",
  "Generating your grocery list…",
];

export function PlanSkeleton() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-8 space-y-8" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-sm text-muted transition-all duration-500">{MESSAGES[msgIndex]}</p>
      </div>

      {/* Meal plan grid skeleton */}
      <div className="overflow-x-auto rounded-2xl border border-border p-4">
        <div className="min-w-[756px]">
          <div className="grid grid-cols-7 gap-3 mb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-border animate-pulse" />
            ))}
          </div>
          {["breakfast", "lunch", "dinner"].map((slot) => (
            <div key={slot} className="grid grid-cols-7 gap-3 mb-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Grocery list skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
