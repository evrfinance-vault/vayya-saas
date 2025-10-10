import React from "react";
import Card from "../Card";

export default function ActivePaymentPlansPanel() {
  return (
    <div className="overview-grid">
      <Card title="Active Payment Plans" width="4x" height="3x" />
    </div>
  );
}

// The “active plans” overview tab will have customer search, and owners
// will be able to change the payment due dates, and optionally put plans on hold
// for up to two months.
