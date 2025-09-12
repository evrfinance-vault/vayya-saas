import React from "react";
import "./Header.css";
import { HeaderActions } from "./HeaderActions";
import { UserMenu } from "./UserMenu";
import { NotificationItem } from "./NotificationsPopover";

type Link = { label: string; href: string; key?: string; active?: boolean };
type Props = {
  title?: string;
  navLinks?: Link[];
  renderLink?: (link: Link) => React.ReactElement;
  notifications?: NotificationItem[];
  onSearch?: () => void;
  onNotifications?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
};

const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  position: "sticky",
  top: 0,
  background: "#accdea",
  color: "#ffffff",
  zIndex: 10,
};
const left: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "left",
  width: "15%",
  gap: 12,
};
const center: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "70%",
  gap: 12,
};
const right: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "right",
  width: "15%",
  gap: 12,
};
const brand: React.CSSProperties = {
  fontWeight: 700,
};
const nav: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  flexFlow: "row wrap",
  gap: 0,
  backgroundColor: "rgba(255,255,255,0.25)",
  borderRadius: "12px",
};

export function Header(props: Props): React.ReactElement {
  const {
    title = "Vault",
    navLinks,
    renderLink,
    ...actions
  } = props;

  return (
    <header style={bar}>
      <div style={left}>{<h2 style={brand}>{title}</h2>}</div>

      <div style={center}>
        {navLinks && navLinks.length > 0 && (
          <nav style={nav}>
            {navLinks.map((l) => renderLink(l) )}
          </nav>
        )}
      </div>

      <div style={right}>
        <HeaderActions {...actions} />
        <UserMenu />
      </div>
    </header>
  );
}
