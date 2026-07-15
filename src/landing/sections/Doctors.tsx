import { gsap, DESKTOP, MOTION, maskedLines, revealUp, warmUp } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { doctors } from "../data";
import WhatsAppCta from "./WhatsAppCta";

export default function Doctors() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(MOTION, () => {
      const heading = section.querySelector("h2");
      if (heading) maskedLines(heading, {}, {});

      const grid = section.querySelector(".l-doctors-grid");
      if (grid) revealUp(section.querySelectorAll(".l-doctor-card"), grid);

      section
        .querySelectorAll<HTMLElement>(".l-doctor-card img")
        .forEach((img) => warmUp(img, { trigger: img.closest(".l-doctor-card") ?? img }));
    });

    mm.add(DESKTOP, () => {
      const middle = section.querySelectorAll(".l-doctor-card")[1];
      if (!middle) return;
      gsap.to(middle, {
        y: -24,
        ease: "none",
        scrollTrigger: {
          trigger: section.querySelector(".l-doctors-grid"),
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });
    });
  });

  return (
    <section ref={ref} id="doctors" className="l-section">
      <div className="l-container">
        <div className="l-doctors-head">
          <span className="l-eyebrow">Doctors</span>
          <h2 className="l-display-2">
            Led by doctors who treat <em>root causes,</em> not just symptoms.
          </h2>
        </div>
        <div className="l-doctors-grid">
          {doctors.map((doctor) => (
            <article className="l-doctor-card" key={doctor.name}>
              <img src={doctor.image} alt={`Portrait of ${doctor.name}`} loading="lazy" />
              <div className="l-doctor-meta">
                <h3>{doctor.name}</h3>
                <p className="l-doctor-credential">{doctor.credential}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="l-doctors-cta">
          <WhatsAppCta>Talk to a doctor</WhatsAppCta>
        </div>
      </div>
    </section>
  );
}
