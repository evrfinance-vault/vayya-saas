import React from "react";
import Card from "../Card";
import { faInfo } from "@fortawesome/free-solid-svg-icons";

export default function SupportPanel() {
  return (
    <div className="admin-card-grid">
      <Card title="Support" icon={faInfo} width="4x"></Card>
    </div>
  );
}
