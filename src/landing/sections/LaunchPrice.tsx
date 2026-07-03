import { gsap, MOTION, maskedLines, revealUp } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { launchPriceSteps } from "../data";
import WhatsAppCta from "./WhatsAppCta";

export default function LaunchPrice() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(MOTION, () => {
      const heading = section.querySelector("h2");
      if (heading) maskedLines(heading, {}, {});

      const timeline = section.querySelector<HTMLElement>(".l-price-timeline");
      const fill = section.querySelector<HTMLElement>(".l-price-line-fill");
      if (timeline && fill) {
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: timeline,
              start: "top 72%",
              end: "bottom 55%",
              scrub: 0.4,
            },
          },
        );
      }

      section.querySelectorAll<HTMLElement>(".l-price-step").forEach((step) => {
        revealUp(step.children, step, { y: 32, stagger: 0.08 });
      });
    });
  });

  return (
    <section ref={ref} id="founding-members" className="l-section">
      <div className="l-container l-price-layout">
        <div className="l-price-head">
          <span className="l-eyebrow">Launch price</span>
          <h2>
            Start with RM99. <em>Risk-free.</em>
          </h2>
          <div className="l-price-cta">
            <WhatsAppCta />
          </div>
        </div>
        <div className="l-price-timeline">
          <div className="l-price-line" aria-hidden="true">
            <div className="l-price-line-fill" />
          </div>
          {launchPriceSteps.map((step) => (
            <div className="l-price-step" key={step.label}>
              <p className="l-price-value">{step.value}</p>
              <p className="l-price-label">{step.label}</p>
              {"badge" in step && step.badge ? (
                <span className="l-price-badge">{step.badge}</span>
              ) : null}
              <p className="l-price-note">{step.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
