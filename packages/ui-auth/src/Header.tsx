import React from "react";
import "./Header.css";
import { UserBadge } from "./UserBadge";
import { LogoutButton } from "./LogoutButton";

type Link = { label: string; href: string };
type Props = { title?: string; navLinks?: Link[] };

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
  marginLeft: 8,
  marginRight: 8,
  paddingLeft: 8,
  paddingRight: 8,
  backgroundColor: "rgba(255,255,255,0.25)",
  borderRadius: "12px",
};

export function Header({ title = "Vault", navLinks }: Props) {
  return (
    <header style={bar}>
      <div style={left}>{<h2 style={brand}>{title}</h2>}</div>
      <div style={center}>
        {navLinks && navLinks.length > 0 && (
          <nav style={nav}>
            {navLinks.map((l) => (
              <a key={l.key} href={l.href} className={l.active ? "active-header-link" : "header-link"}>
                <small>{l.label}</small>
              </a>
            ))}
          </nav>
        )}
      </div>
      <div style={right}>
        <UserBadge />
        <LogoutButton />
      </div>
    </header>
  );
}
