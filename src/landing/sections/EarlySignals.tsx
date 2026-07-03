import { gsap, ScrollTrigger, MOTION, maskedLines } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { diseaseMarqueeTop, diseaseMarqueeBottom, monitorProofs } from "../data";

function MarqueeRow({ items, className }: { items: string[]; className: string }) {
  const loop = [...items, ...items, ...items];
  return (
    <div className="l-marquee" aria-hidden="true">
      <div className={`l-marquee-row ${className}`}>
        {loop.map((item, index) => (
          <span className="l-marquee-item" key={`${item}-${index}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EarlySignals() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(MOTION, () => {
      const heading = section.querySelector("h2");
      if (heading) maskedLines(heading, {}, {});

      const topRow = section.querySelector(".l-marquee-row-top");
      const bottomRow = section.querySelector(".l-marquee-row-bottom");
      if (!topRow || !bottomRow) return;

      const drifts = [
        gsap.to(topRow, { xPercent: -33.334, duration: 64, ease: "none", repeat: -1 }),
        gsap.fromTo(
          bottomRow,
          { xPercent: -33.334 },
          { xPercent: 0, duration: 64, ease: "none", repeat: -1 },
        ),
      ];

      // The marquees speed up with scroll velocity, then settle back.
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onUpdate(self) {
          const velocity = Math.abs(self.getVelocity());
          const boost = gsap.utils.clamp(1, 5, 1 + velocity / 900);
          drifts.forEach((drift) => {
            gsap.to(drift, { timeScale: boost, duration: 0.3, overwrite: true });
            gsap.to(drift, { timeScale: 1, duration: 1.4, delay: 0.3, overwrite: false });
          });
        },
      });

      // The dark panel relaxes from an inset frame to full bleed as it enters.
      gsap.fromTo(
        section,
        { clipPath: "inset(4% 3% 4% 3% round 40px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 92%",
            end: "top 38%",
            scrub: 0.4,
          },
        },
      );
    });
  });

  return (
    <section ref={ref} id="early-indicators" className="l-signals l-section">
      <div className="l-container">
        <span className="l-eyebrow">Early indicators</span>
        <h2 className="l-display-2">
          Monitor early indicators of <em>long-term diseases</em>
        </h2>
        <ul className="l-signals-proofs">
          {monitorProofs.map((proof) => (
            <li key={proof}>{proof}</li>
          ))}
        </ul>
      </div>
      <div className="l-signals-marquees">
        <MarqueeRow items={diseaseMarqueeTop} className="l-marquee-row-top" />
        <MarqueeRow items={diseaseMarqueeBottom} className="l-marquee-row-bottom" />
      </div>
      <ul className="l-visually-hidden">
        {[...diseaseMarqueeTop, ...diseaseMarqueeBottom].map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>
    </section>
  );
}
