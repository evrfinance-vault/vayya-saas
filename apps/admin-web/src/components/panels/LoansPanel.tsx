import React from "react";
import Card from "../Card";
import { faInfo } from "@fortawesome/free-solid-svg-icons";

export default function LoansPanel() {
  return (
    <div className="admin-card-grid">
      <Card title="Loans" icon={faInfo} width="4x"></Card>
    </div>
  );
}
