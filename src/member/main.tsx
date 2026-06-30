import React from "react";
import ReactDOM from "react-dom/client";
import DashboardHome from "./DashboardHome";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("member-root")!).render(
  <React.StrictMode>
    <DashboardHome />
  </React.StrictMode>,
);
