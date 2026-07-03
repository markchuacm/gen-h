import { Check, X } from "lucide-react";
import { gsap, ScrollTrigger, MOTION, maskedLines } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { comparisonRows } from "../data";

export default function Comparison() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(MOTION, () => {
      const heading = section.querySelector("h2");
      if (heading) maskedLines(heading, {}, {});

      const rows = section.querySelectorAll<HTMLElement>(".l-compare-row");
      ScrollTrigger.batch(rows, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.from(batch, {
            y: 28,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
          }),
      });

      // The "100+" cell counts up once when it enters.
      const countCell = section.querySelector<HTMLElement>("[data-count-up]");
      if (countCell) {
        const state = { value: 0 };
        gsap.to(state, {
          value: 100,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: { trigger: countCell, start: "top 85%", once: true },
          onUpdate() {
            countCell.textContent = `${Math.round(state.value)}+`;
          },
        });
      }
    });
  });

  return (
    <section ref={ref} id="compare" className="l-section">
      <div className="l-container">
        <div className="l-compare-head">
          <h2 className="l-display-3">
            A <em>Gen-H</em> check-up vs. a standard screening.
          </h2>
          <p className="l-compare-sub">
            Most screenings tell you whether you&rsquo;re sick today. Gen-H is built to help
            you stay well for decades.
          </p>
        </div>
        <div className="l-compare-table" role="table" aria-label="Gen-H compared with a standard screening">
          <div className="l-compare-row l-compare-header" role="row">
            <div className="l-compare-cell" role="columnheader" />
            <div className="l-compare-cell l-compare-genh" role="columnheader">
              Gen-H
            </div>
            <div className="l-compare-cell l-compare-standard" role="columnheader">
              Standard screening
            </div>
          </div>
          {comparisonRows.map((row) => (
            <div className="l-compare-row" role="row" key={row.criterion}>
              <div className="l-compare-cell" role="cell">
                {row.criterion}
              </div>
              <div className="l-compare-cell l-compare-genh" role="cell">
                {row.genhValue ? (
                  <span data-count-up={row.genhValue === "100+" ? "" : undefined}>
                    {row.genhValue}
                  </span>
                ) : (
                  <span className="l-compare-check" aria-label="Included">
                    <Check strokeWidth={2.4} />
                  </span>
                )}
              </div>
              <div className="l-compare-cell l-compare-standard" role="cell">
                {row.standardValue ? (
                  row.standardValue
                ) : (
                  <span className="l-compare-x" aria-label="Not included">
                    <X strokeWidth={2.4} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
