import { useLayoutEffect } from "react";
import { initScroll } from "./lib/scroll";
import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import Manifesto from "./sections/Manifesto";
import ConnectsTheDots from "./sections/ConnectsTheDots";
import BiomarkerGallery from "./sections/BiomarkerGallery";
import EarlySignals from "./sections/EarlySignals";
import Process from "./sections/Process";
import Doctors from "./sections/Doctors";
import Comparison from "./sections/Comparison";
import LaunchPrice from "./sections/LaunchPrice";
import Faq from "./sections/Faq";
import FinalCta from "./sections/FinalCta";

export default function LandingPage() {
  // Parent effects run after children: every section's triggers exist before
  // smooth scrolling starts.
  useLayoutEffect(() => initScroll(), []);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <ConnectsTheDots />
        <BiomarkerGallery />
        <EarlySignals />
        <Process />
        <Doctors />
        <Comparison />
        <LaunchPrice />
        <Faq />
        <FinalCta />
      </main>
    </>
  );
}
