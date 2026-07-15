import { gsap, MOTION, maskedLines } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { heroProofs, heroVideo } from "../data";
import WhatsAppCta from "./WhatsAppCta";

export default function Hero() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(MOTION, () => {
      const heading = section.querySelector("h1");
      const media = section.querySelector(".l-hero-media");
      const scrim = section.querySelector(".l-hero-scrim");
      const content = section.querySelector(".l-hero-content");
      const wordmark = section.querySelector(".l-hero-wordmark");
      const secondary = section.querySelectorAll(
        ".l-hero-sub, .l-hero-cta-row, .l-hero-proofs",
      );
      const cue = section.querySelector(".l-hero-scroll-cue");
      if (!heading || !media || !content) return;

      // Load choreography: masked line reveal, then supporting content.
      if (wordmark) {
        gsap.from(wordmark, {
          y: 16,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.1,
        });
      }
      maskedLines(heading, { delay: 0.25 });
      gsap.from(secondary, {
        y: 36,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.7,
      });
      if (cue) {
        gsap.from(cue, { autoAlpha: 0, duration: 0.8, delay: 1.3 });
      }
      if (scrim) {
        gsap.from(scrim, { opacity: 0.4, duration: 1.4, ease: "power2.out" });
      }

      // Exit parallax: the hero sinks away as the story begins.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 0.4,
          },
        })
        .to(media, { yPercent: 18, scale: 1.06, ease: "none" }, 0)
        .to(content, { yPercent: -14, autoAlpha: 0.1, ease: "none" }, 0);
    });
  });

  return (
    <header ref={ref} className="l-hero" id="top">
      <div className="l-hero-media" aria-hidden="true">
        <video
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>
      <div className="l-hero-scrim" aria-hidden="true" />
      <div className="l-hero-content">
        <a className="l-hero-wordmark" href="#top" aria-label="Verae home">
          Verae
        </a>
        <h1 className="l-display-1">
          Helping you stay well for <em>life&rsquo;s best moments</em>
        </h1>
        <p className="l-hero-sub">It starts with understanding your health early.</p>
        <div className="l-hero-cta-row">
          <WhatsAppCta />
          <a className="l-button l-button-ghost l-on-dark" href="#how-it-works">
            How it works
          </a>
        </div>
        <div className="l-hero-proofs">
          {heroProofs.map((proof) => (
            <div className="l-hero-proof" key={proof.title}>
              <strong>{proof.title}</strong>
              <span>{proof.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="l-hero-scroll-cue" aria-hidden="true">
        Scroll
      </div>
    </header>
  );
}
