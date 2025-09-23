import React from "react";
import { useGreeting, useDateStamp, UserBadge } from "@packages/ui-auth";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

const tinydot: React.CSSProperties = {
  fontSize: "x-small",
  color: "lightgreen",
  marginRight: 3,
};

export default function OverviewPage(): React.ReactElement {
  const greeting = useGreeting();
  const today = useDateStamp();

  return (
    <div
      className="page-content"
      style={{
        padding: 24,
        marginLeft: 12,
        marginTop: 24,
        display: "grid",
        gap: 0,
      }}
    >
      <div className="preheading" style={{ fontSize: "small" }}>
        <span style={tinydot}>
          <FontAwesomeIcon icon={faCircle} />
        </span>
        Live Dashboard • {today}
      </div>
      <h1 className="heading">
        {greeting}, <UserBadge />
      </h1>
    </div>
  );
}
