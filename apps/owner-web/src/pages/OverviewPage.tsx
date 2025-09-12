import React from "react";
import { useGreeting, useDateStamp, UserBadge } from "@packages/ui-auth";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
library.add(fas, far, fab)

const tinydot: React.CSSProperties = {
  fontSize: "xx-small",
  color: "lightgreen"
};

export default function OverviewPage(): React.ReactElement {
  const greeting = useGreeting();
  const today = useDateStamp();

  return (
    <div style={{ padding: 24, marginLeft: 12, marginTop: 24, display: "grid", gap: 0 }}>
      <div className="preheading" style={{ fontSize: "small" }}>
        <span style={tinydot}><FontAwesomeIcon icon="fa-solid fa-circle" /></span>
        Live Dashboard • {today}
      </div>
      <h1 className="heading">
        {greeting}, <UserBadge />
      </h1>
    </div>
  );
}
