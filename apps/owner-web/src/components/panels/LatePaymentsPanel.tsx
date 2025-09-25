import React from "react";
import Card from "../Card";
import "./Panel.css";

export default function LatePaymentsPanel() {
  return (
    <div className="overview-grid">
      <Card title="Missed / Late Payments" />
      <Card title="Recovery Actions" />
    </div>
  );
}
