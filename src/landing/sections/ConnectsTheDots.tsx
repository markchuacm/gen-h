import { gsap, MOTION, DESKTOP, maskedLines, warmUp } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { futureHealthCards } from "../data";

export default function ConnectsTheDots() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(MOTION, () => {
      const heading = section.querySelector("h2");
      if (heading) maskedLines(heading, {}, {});

      const visuals = section.querySelectorAll(".l-dots-visual");
      gsap.from(visuals, {
        clipPath: "inset(12% 0% 12% 0% round 24px)",
        y: 56,
        autoAlpha: 0,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: section.querySelector(".l-dots-grid"),
          start: "top 78%",
          once: true,
        },
      });

      section
        .querySelectorAll<HTMLElement>(".l-dots-visual img")
        .forEach((img) => warmUp(img, { trigger: img.closest(".l-dots-card") ?? img }));
    });

    mm.add(DESKTOP, () => {
      // Each card's image drifts at its own rate for depth.
      const rates = [-6, -12, -8];
      section.querySelectorAll<HTMLElement>(".l-dots-visual img").forEach((img, i) => {
        gsap.set(img, { scale: 1.12 });
        gsap.fromTo(
          img,
          { yPercent: -rates[i] / 2 },
          {
            yPercent: rates[i] / 2,
            ease: "none",
            scrollTrigger: {
              trigger: img.closest(".l-dots-card"),
              start: "top bottom",
              end: "bottom top",
              scrub: 0.4,
            },
          },
        );
      });
    });
  });

  return (
    <section ref={ref} className="l-section">
      <div className="l-container">
        <h2 className="l-display-2 l-dots-heading">
          That&rsquo;s why Gen-H <em>connects the dots</em>
        </h2>
        <div className="l-dots-grid">
          {futureHealthCards.map((card) => (
            <article className="l-dots-card" key={card.title}>
              <div className="l-dots-visual">
                <img src={card.image} alt={card.imageAlt} loading="lazy" />
                <span className="l-dots-number" aria-hidden="true">
                  {card.number}
                </span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
