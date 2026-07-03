import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

// matchMedia conditions shared by every section. Pins and the horizontal
// track only exist in DESKTOP; MOBILE keeps the cheap reveals and warm-ups.
export const DESKTOP = "(min-width: 900px) and (prefers-reduced-motion: no-preference)";
export const MOBILE = "(max-width: 899.98px) and (prefers-reduced-motion: no-preference)";
export const MOTION = "(prefers-reduced-motion: no-preference)";

const motionQuery = "(prefers-reduced-motion: no-preference)";

// The `is-motion` class gates the CSS-only layout changes (horizontal track,
// stacked process stage). Set at module scope so it lands before first paint.
if (typeof window !== "undefined" && window.matchMedia(motionQuery).matches) {
  document.documentElement.classList.add("is-motion");
}

let lenis: Lenis | null = null;
let rafCallback: ((time: number) => void) | null = null;

function startLenis() {
  if (lenis) return;
  document.documentElement.classList.add("is-motion");
  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.12,
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  rafCallback = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(rafCallback);
  gsap.ticker.lagSmoothing(0);
}

function stopLenis() {
  document.documentElement.classList.remove("is-motion");
  if (rafCallback) gsap.ticker.remove(rafCallback);
  rafCallback = null;
  lenis?.destroy();
  lenis = null;
}

/** Bootstraps smooth scrolling. Call once from LandingPage; returns cleanup. */
export function initScroll(): () => void {
  const media = window.matchMedia(motionQuery);
  if (media.matches) startLenis();
  else stopLenis();

  const onChange = (event: MediaQueryListEvent) => {
    if (event.matches) startLenis();
    else stopLenis();
    ScrollTrigger.refresh();
  };
  media.addEventListener("change", onChange);

  // Lazy media below the fold shifts layout; re-measure pin distances once
  // everything has loaded.
  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener("load", onLoad);

  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("load", onLoad);
    stopLenis();
  };
}

/** Scroll-driven image warm-up: grayscale at rest, full colour as the element
    crosses the viewport's centre band. Replaces the brand's hover warm-up. */
export function warmUp(
  target: gsap.DOMTarget,
  vars: Partial<ScrollTrigger.Vars> = {},
) {
  gsap.fromTo(
    target,
    { filter: "grayscale(1) brightness(0.92)" },
    {
      filter: "grayscale(0) brightness(1)",
      ease: "none",
      scrollTrigger: {
        trigger: target as gsap.DOMTarget & Element,
        start: "top 78%",
        end: "center 52%",
        scrub: 0.4,
        ...vars,
      },
    },
  );
}

/** Once-triggered rise-and-fade reveal for a group of elements. */
export function revealUp(
  targets: gsap.DOMTarget,
  trigger: Element,
  vars: gsap.TweenVars = {},
) {
  gsap.from(targets, {
    y: 48,
    autoAlpha: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    scrollTrigger: {
      trigger,
      start: "top 78%",
      once: true,
    },
    ...vars,
  });
}

/** Masked line reveal for a heading. Returns the SplitText so callers can
    sequence against it. */
export function maskedLines(
  el: Element,
  vars: gsap.TweenVars = {},
  triggerVars: Partial<ScrollTrigger.Vars> | null = null,
) {
  const split = SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    linesClass: "l-split-line",
  });
  gsap.from(split.lines, {
    yPercent: 110,
    duration: 1.05,
    ease: "power4.out",
    stagger: 0.09,
    ...(triggerVars
      ? { scrollTrigger: { trigger: el, start: "top 80%", once: true, ...triggerVars } }
      : {}),
    ...vars,
  });
  return split;
}
