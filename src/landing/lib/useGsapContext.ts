import { useLayoutEffect, useRef } from "react";
import { gsap } from "./scroll";

/** Runs GSAP setup inside a matchMedia scoped to the returned ref's element.
    Everything registered in `setup` is reverted on unmount (StrictMode-safe),
    and condition-gated work re-runs automatically when media flips. */
export function useMotion<T extends HTMLElement>(
  setup: (mm: gsap.MatchMedia, scope: T) => void,
) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const scope = ref.current;
    if (!scope) return;
    const mm = gsap.matchMedia(scope);
    setup(mm, scope);
    return () => mm.revert();
    // Setup runs once per mount by design; sections close over static data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
