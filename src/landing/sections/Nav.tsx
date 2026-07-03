import { gsap, ScrollTrigger, MOTION } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { whatsappHref } from "../data";
import { WhatsAppIcon } from "./WhatsAppCta";

export default function Nav() {
  const ref = useMotion<HTMLElement>((mm, nav) => {
    mm.add(MOTION, () => {
      gsap.set(nav, { y: -28, autoAlpha: 0 });
      const show = gsap.to(nav, {
        y: 0,
        autoAlpha: 1,
        duration: 0.45,
        ease: "power3.out",
        paused: true,
      });

      ScrollTrigger.create({
        start: () => window.innerHeight * 0.72,
        end: "max",
        onEnter: () => show.play(),
        onLeaveBack: () => show.reverse(),
        onUpdate(self) {
          if (self.direction === 1) show.reverse();
          else show.play();
        },
      });
    });
  });

  return (
    <nav ref={ref} className="l-nav" aria-label="Main">
      <a className="l-nav-wordmark" href="#top">
        Gen-H
      </a>
      <div className="l-nav-links">
        <a href="#what-we-test">What we test</a>
        <a href="#how-it-works">How it works</a>
        <a href="#founding-members">Pricing</a>
      </div>
      <a className="l-nav-cta" href={whatsappHref} target="_blank" rel="noreferrer">
        <span>Book a consult</span>
        <WhatsAppIcon />
      </a>
    </nav>
  );
}
