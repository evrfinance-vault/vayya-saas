import React from "react";
import NameCard from "../cards/NameCard";
import AccountHealthCard from "../cards/AccountHealthCard";
import RevenueByPlanCard from "../cards/RevenueByPlanCard";
import PayoutCalendarCard from "../cards/PayoutCalendarCard";
import AIAssistantCard from "../cards/AIAssistantCard";

export default function BoardPanel() {
  return (
    <div className="overview-grid">
      <AccountHealthCard />
      <RevenueByPlanCard width="2x" />
      <NameCard height="3x" />
      <PayoutCalendarCard width="2x" height="2x" />
      <AIAssistantCard width="1x" height="2x" />
    </div>
  );
}
