import React from "react";
import Card from "../Card";
import NameCard from "../cards/NameCard";
import AccountHealthCard from "../cards/AccountHealthCard";
import {
  faCalendarDays,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";

export default function BoardPanel() {
  return (
    <div className="overview-grid">
      <AccountHealthCard />
      <Card title="Total Revenue by Plan" icon={faDollarSign} width="2x" />
      <NameCard height="3x" />
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
