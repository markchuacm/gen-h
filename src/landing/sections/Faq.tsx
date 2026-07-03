import { useState } from "react";
import { Plus } from "lucide-react";
import { MOTION, revealUp } from "../lib/scroll";
import { useMotion } from "../lib/useGsapContext";
import { faqs } from "../data";

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const ref = useMotion<HTMLElement>((mm, section) => {
    mm.add(MOTION, () => {
      revealUp(section.querySelectorAll(".l-faq-head, .l-faq-list"), section, {
        y: 40,
        stagger: 0.15,
      });
    });
  });

  return (
    <section ref={ref} id="faq" className="l-faq l-section">
      <div className="l-container l-faq-layout">
        <div className="l-faq-head">
          <span className="l-eyebrow">Questions</span>
          <h2 className="l-display-3">What to know before you enquire.</h2>
        </div>
        <div className="l-faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div className={`l-faq-item${isOpen ? " is-open" : ""}`} key={faq.question}>
                <button
                  type="button"
                  className="l-faq-question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span>{faq.question}</span>
                  <Plus strokeWidth={1.3} aria-hidden="true" />
                </button>
                <div className="l-faq-answer" id={`faq-answer-${index}`} role="region">
                  <div className="l-faq-answer-inner">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
