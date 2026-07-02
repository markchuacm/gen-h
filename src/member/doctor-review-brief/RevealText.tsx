// ─── Doctor Review Brief · word-by-word reveal ────────────────────────────────
// Left-to-right reveal for text that arrives whole (fallback narratives, section
// copy). Genuinely streamed text doesn't need this — it grows as deltas land.
// Respects prefers-reduced-motion by rendering instantly.

import { useMemo } from "react";

const WORD_STAGGER_MS = 30;
const MAX_ANIMATED_WORDS = 120;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function RevealText({ text }: { text: string }) {
  const reduced = useMemo(prefersReducedMotion, []);
  const words = useMemo(() => text.split(/(\s+)/), [text]);

  if (reduced || words.length > MAX_ANIMATED_WORDS * 2) return <>{text}</>;

  let index = 0;
  return (
    <>
      {words.map((word, i) => {
        if (!word.trim()) return word;
        const delay = Math.min(index++, MAX_ANIMATED_WORDS) * WORD_STAGGER_MS;
        return (
          <span
            key={i}
            className="drb-reveal-word"
            style={{ animationDelay: `${delay}ms` }}
          >
            {word}
          </span>
        );
      })}
    </>
  );
}
