import React from "react";
import Card from "../Card";
import NameCard from "../cards/NameCard";
import AccountHealthCard from "../cards/AccountHealthCard";
import RevenueByPlanCard from "../cards/RevenueByPlanCard";
import PayoutCalendarCard from "../cards/PayoutCalendarCard";

export default function BoardPanel() {
  return (
    <div className="overview-grid">
      <AccountHealthCard />
      <RevenueByPlanCard width="2x" />
      <NameCard height="3x" />
      <PayoutCalendarCard width="2x" height="2x" />
      <Card title="AI Assistant" align="center" height="2x" />
    </div>
  );
}
