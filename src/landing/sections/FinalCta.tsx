import { gsap, MOTION, maskedLines } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { heroMountainImage } from "../data";
import WhatsAppCta from "./WhatsAppCta";

export default function FinalCta() {
  const ref = useMotion<HTMLDivElement>((mm, wrapper) => {
    mm.add(MOTION, () => {
      const image = wrapper.querySelector(".l-final-frame img");
      const heading = wrapper.querySelector("h2");
      const supporting = wrapper.querySelectorAll(".l-final-sub, .l-final-content .l-button");

      if (image) {
        gsap.fromTo(
          image,
          { scale: 1.12, filter: "grayscale(1) brightness(0.9)" },
          {
            scale: 1,
            filter: "grayscale(0) brightness(1)",
            ease: "none",
            scrollTrigger: {
              trigger: wrapper,
              start: "top bottom",
              end: "top top",
              scrub: 0.4,
            },
          },
        );
      }
      if (heading) {
        maskedLines(heading, {}, { trigger: wrapper, start: "top 45%" });
      }
      gsap.from(supporting, {
        y: 28,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: wrapper, start: "top 40%", once: true },
      });
    });
  });

  return (
    <>
      <div ref={ref} className="l-final" id="final-cta">
        <section className="l-final-frame" aria-label="Get started">
          <img src={heroMountainImage} alt="" loading="lazy" />
          <div className="l-final-scrim" aria-hidden="true" />
          <div className="l-final-content">
            <h2 className="l-display-1">
              Do it for the <em>people</em> who matter most
            </h2>
            <p className="l-final-sub">Take care of yourself, with Gen-H.</p>
            <WhatsAppCta />
          </div>
        </section>
      </div>
      <footer className="l-footer">
        <div className="l-container l-footer-inner">
          <div className="l-footer-brand">
            <span className="l-footer-wordmark">Gen-H</span>
            <span className="l-footer-tagline">
              Helping you stay well for life&rsquo;s best moments
            </span>
          </div>
          <div className="l-footer-links">
            <a href="#how-it-works">How it works</a>
            <a href="#what-we-test">What we test</a>
            <a href="#founding-members">Pricing</a>
          </div>
        </div>
      </footer>
    </>
  );
}
