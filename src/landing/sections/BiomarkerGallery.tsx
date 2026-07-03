import { gsap, DESKTOP, MOBILE, MOTION, maskedLines, warmUp } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { biomarkerGroups, biomarkerProofs } from "../data";

export default function BiomarkerGallery() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    const counter = section.querySelector<HTMLElement>(".l-gallery-counter");
    const fill = section.querySelector<HTMLElement>(".l-gallery-progress-fill");

    mm.add(MOTION, () => {
      const heading = section.querySelector("h2");
      if (heading) maskedLines(heading, {}, {});
    });

    mm.add(DESKTOP, () => {
      const viewport = section.querySelector<HTMLElement>(".l-gallery-viewport");
      const track = section.querySelector<HTMLElement>(".l-gallery-track");
      if (!viewport || !track || !counter || !fill) return;

      const distance = () => track.scrollWidth - track.clientWidth;
      gsap.set(fill, { scaleX: 0 });
      counter.textContent = "0+";

      const xTween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: viewport,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle(self) {
            gsap.set(track, { willChange: self.isActive ? "transform" : "auto" });
          },
          onUpdate(self) {
            counter.textContent = `${Math.round(self.progress * 100)}+`;
            gsap.set(fill, { scaleX: self.progress });
          },
        },
      });

      // Panels warm from grayscale to colour as they cross the pinned view.
      section.querySelectorAll<HTMLElement>(".l-gallery-panel img").forEach((img) => {
        gsap.fromTo(
          img,
          { filter: "grayscale(1) brightness(0.92)" },
          {
            filter: "grayscale(0) brightness(1)",
            ease: "none",
            scrollTrigger: {
              trigger: img.closest(".l-gallery-panel"),
              containerAnimation: xTween,
              start: "left 82%",
              end: "left 38%",
              scrub: 0.4,
            },
          },
        );
      });
    });

    mm.add(MOBILE, () => {
      section.querySelectorAll<HTMLElement>(".l-gallery-panel img").forEach((img) => {
        warmUp(img, { trigger: img.closest(".l-gallery-panel") ?? img });
      });
      if (counter) {
        const state = { value: 0 };
        counter.textContent = "0+";
        gsap.to(state, {
          value: 100,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: counter, start: "top 85%", once: true },
          onUpdate() {
            counter.textContent = `${Math.round(state.value)}+`;
          },
        });
      }
    });
  });

  return (
    <section ref={ref} id="what-we-test" className="l-gallery l-section">
      <div className="l-gallery-viewport">
        <div className="l-gallery-layout">
          <div className="l-gallery-head">
            <span className="l-eyebrow">What we test</span>
            <h2 className="l-display-2">
              The answers are in the <em>details</em>
            </h2>
            <div className="l-gallery-progress" aria-hidden="true">
              <div className="l-gallery-progress-fill" />
            </div>
            <p className="l-gallery-counter" aria-hidden="true">
              100+
            </p>
            <ul className="l-gallery-proofs">
              {biomarkerProofs.map((proof) => (
                <li key={proof}>{proof}</li>
              ))}
            </ul>
          </div>
          <div className="l-gallery-track">
            {biomarkerGroups.map((group) => {
              const Icon = group.icon;
              return (
                <article
                  className="l-gallery-panel"
                  key={group.title}
                  aria-label={`${group.title}: ${group.tests.join(", ")}`}
                >
                  <img src={group.image} alt={group.imageAlt} loading="lazy" />
                  <span className="l-gallery-panel-scrim" aria-hidden="true" />
                  <div className="l-gallery-panel-content">
                    <span className="l-gallery-panel-icon" aria-hidden="true">
                      <Icon strokeWidth={1.3} />
                    </span>
                    <span className="l-gallery-panel-count">{group.count}</span>
                    <h3>{group.title}</h3>
                    <ul className="l-gallery-panel-pills">
                      {group.tests.slice(0, 4).map((test) => (
                        <li key={test}>{test}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
