import React from "react";
import Card from "../Card";
import {
  faCalendarDays,
  faCircleUser,
  faDollarSign,
  faHeartPulse,
} from "@fortawesome/free-solid-svg-icons";

export default function VayyaBoardPanel() {
  return (
    <div className="overview-grid">
      <Card title="Account Health" icon={faHeartPulse} />
      <Card title="Total Revenue by Plan" icon={faDollarSign} width="2x" />
      <Card title="Name" icon={faCircleUser} height="3x" />
      <Card
        title="Payout Calendar"
        icon={faCalendarDays}
        width="2x"
        height="2x"
      />
      <Card title="AI Assistant" align="center" height="2x" />
    </div>
  );
}
