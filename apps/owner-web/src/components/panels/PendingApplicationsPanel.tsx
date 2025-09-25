import React from "react";
import Card from "../Card";
import "./Panel.css";

export default function PendingApplicationsPanel() {
  return (
    <div className="overview-grid">
      <Card title="Pending Applications" />
      <Card title="Funnel Conversion" />
    </div>
  );
}
