import React from "react";
import ReactDOM from "react-dom/client";
import "lenis/dist/lenis.css";
import "./landing.css";
import "../legal/legal.css";
import LandingPage from "./LandingPage";

ReactDOM.createRoot(document.getElementById("landing-root")!).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>,
);
