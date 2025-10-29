import React from "react";
import Card from "../Card";
import { faInfo } from "@fortawesome/free-solid-svg-icons";

export default function ResourcesPanel() {
  return (
    <div className="admin-card-grid">
      <Card title="Resources" icon={faInfo} width="4x"></Card>
    </div>
  );
}
