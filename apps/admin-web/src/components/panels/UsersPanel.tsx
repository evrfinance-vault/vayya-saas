import React from "react";
import Card from "../Card";
import { faInfo } from "@fortawesome/free-solid-svg-icons";

export default function UsersPanel() {
  return (
    <div className="admin-card-grid">
      <Card title="Users" icon={faInfo} width="4x"></Card>
    </div>
  );
}
