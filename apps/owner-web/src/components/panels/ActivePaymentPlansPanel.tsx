import React from "react";
import Card from "../Card";
import "./Panel.css";

export default function ActivePaymentPlansPanel() {
  return (
    <div className="overview-grid">
      <Card title="Active Plans Overview" />
      <Card title="Delinquency Watchlist" />
      <Card title="Segment Breakdown" />
    </div>
  );
}
