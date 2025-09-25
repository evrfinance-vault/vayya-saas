import React from "react";
import Card from "../Card";
import "./Panel.css";

export default function TotalRevenuePanel() {
  return (
    <div className="overview-grid">
      <Card title="Total Revenue by Plans">
        <p>Placeholder chart area</p>
      </Card>
      <Card title="Account Health" />
      <Card title="Payout Calendar" />
      <Card title="Customers" />
      <Card title="AI Assistant" />
    </div>
  );
}
