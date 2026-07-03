import { gsap, DESKTOP, MOBILE, MOTION, maskedLines, warmUp } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { processSteps, bpHealthcareLogo, innoquestLogo } from "../data";
import WhatsAppCta from "./WhatsAppCta";

export default function Process() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(MOTION, () => {
      const heading = section.querySelector("h2");
      if (heading) maskedLines(heading, {}, {});
    });

    mm.add(DESKTOP, () => {
      const stage = section.querySelector<HTMLElement>(".l-process-stage");
      const steps = Array.from(section.querySelectorAll<HTMLElement>(".l-process-step"));
      const railFills = section.querySelectorAll<HTMLElement>(".l-process-rail span i");
      if (!stage || steps.length === 0) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          onToggle(self) {
            gsap.set(steps, { willChange: self.isActive ? "transform" : "auto" });
          },
        },
      });

      steps.forEach((step, index) => {
        const visual = step.querySelector(".l-process-visual");
        const image = step.querySelector(".l-process-visual img");
        const copy = step.querySelectorAll(
          ".l-process-index, h3, .l-process-copy p, .l-process-partners",
        );

        if (index === 0) {
          // Step 1 is visible at pin start; hold it, fill its rail segment.
          tl.to(railFills[0], { scaleY: 1, duration: 0.6, ease: "none" }, 0);
          tl.to({}, { duration: 0.4 });
          return;
        }

        const previous = steps[index - 1];
        const previousCopy = previous.querySelectorAll(
          ".l-process-index, h3, .l-process-copy p, .l-process-partners",
        );

        tl.fromTo(
          visual,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "none" },
        )
          .fromTo(image, { scale: 1.1 }, { scale: 1, duration: 1, ease: "none" }, "<")
          .to(previousCopy, { autoAlpha: 0, y: -28, duration: 0.35, ease: "none" }, "<")
          .fromTo(
            copy,
            { autoAlpha: 0, y: 36 },
            { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "none" },
            "<0.4",
          )
          .to(railFills[index], { scaleY: 1, duration: 0.6, ease: "none" }, "<")
          .to({}, { duration: 0.4 });
      });

      // Later steps start hidden: their visuals covered, copy transparent.
      steps.forEach((step, index) => {
        if (index === 0) return;
        gsap.set(step.querySelector(".l-process-visual"), {
          clipPath: "inset(100% 0% 0% 0%)",
        });
        gsap.set(
          step.querySelectorAll(".l-process-index, h3, .l-process-copy p, .l-process-partners"),
          { autoAlpha: 0 },
        );
      });
    });

    mm.add(MOBILE, () => {
      section.querySelectorAll<HTMLElement>(".l-process-step").forEach((step) => {
        gsap.from(step, {
          y: 48,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 82%", once: true },
        });
        const img = step.querySelector<HTMLElement>(".l-process-visual img");
        if (img) warmUp(img, { trigger: step });
      });
    });
  });

  return (
    <section ref={ref} id="how-it-works" className="l-section">
      <div className="l-container l-process-head">
        <span className="l-eyebrow">How it works</span>
        <h2 className="l-display-2">
          From early signals to a plan you can <em>act on</em>.
        </h2>
      </div>
      <div className="l-process-stage">
        <div className="l-process-rail" aria-hidden="true">
          {processSteps.map((step) => (
            <span key={step.id}>
              <i />
            </span>
          ))}
        </div>
        <div className="l-process-steps">
          {processSteps.map((step) => (
            <article className="l-process-step" key={step.id}>
              <div className="l-process-copy">
                <span className="l-process-index" aria-hidden="true">
                  {step.index}
                </span>
                <h3>{step.title}</h3>
                <p>{step.summary}</p>
                {step.id === "blood-draw" ? (
                  <div className="l-process-partners">
                    <img src={bpHealthcareLogo} alt="BP Healthcare" loading="lazy" />
                    <img src={innoquestLogo} alt="Innoquest" loading="lazy" />
                  </div>
                ) : null}
              </div>
              <div className="l-process-visual">
                <img src={step.image} alt={step.imageAlt} loading="lazy" />
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="l-process-cta">
        <WhatsAppCta />
      </div>
    </section>
  );
}
