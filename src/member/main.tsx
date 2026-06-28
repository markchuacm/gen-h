import React from "react";
import ReactDOM from "react-dom/client";
import { MemberApp } from "./MemberApp";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("member-root")!).render(
  <React.StrictMode>
    <MemberApp />
  </React.StrictMode>,
);
