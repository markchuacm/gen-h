import { Fragment } from "react";
import { gsap, DESKTOP, MOBILE } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { introRevealWords } from "../data";

const ACCENT_WORD = "less confusing.";
const sentence = introRevealWords.join(" ");

function buildWordInk(section: HTMLElement, pinDistance: string) {
  const words = section.querySelectorAll<HTMLElement>(".l-word");
  gsap.set(words, { color: "var(--word-rest)" });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: `+=${pinDistance}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
    },
  });
  words.forEach((word) => {
    const isAccent = word.closest("em") !== null;
    tl.to(
      word,
      { color: isAccent ? "var(--accent)" : "var(--ink)", duration: 1, ease: "none" },
      "-=0.35",
    );
  });
}

export default function Manifesto() {
  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(DESKTOP, () => buildWordInk(section, "120%"));
    mm.add(MOBILE, () => buildWordInk(section, "80%"));
  });

  return (
    <section ref={ref} className="l-manifesto" aria-label="Why it matters">
      <div className="l-manifesto-inner">
        <span className="l-eyebrow">Why it matters</span>
        <p aria-label={sentence}>
          {introRevealWords.map((word, index) => (
            <Fragment key={word}>
              {word === ACCENT_WORD ? (
                <em>
                  <span className="l-word" aria-hidden="true">
                    {word}
                  </span>
                </em>
              ) : (
                <span className="l-word" aria-hidden="true">
                  {word}
                </span>
              )}
              {index < introRevealWords.length - 1 ? " " : null}
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}
