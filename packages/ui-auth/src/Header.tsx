import React from "react";
import { UserBadge } from "./UserBadge";
import { LogoutButton } from "./LogoutButton";
import { useRole } from "./useRole";

type Link = { label: string; href: string }
type Props = { title?: string; navLinks?: Link[]; showRole?: boolean }

const bar: React.CSSProperties = {
  display:"flex",
  alignItems:"center",
  justifyContent:"space-between",
  padding:"12px 16px",
  position:"sticky",
  top:0,
  background:"#accdea",
  color:"#ffffff",
  zIndex:10
 }
const left: React.CSSProperties = {
  display:"flex",
  alignItems:"center",
  justifyContent: "left",
  width:"25%",
  gap:12
}
const center: React.CSSProperties = {
  display:"flex",
  alignItems:"center",
  justifyContent: "center",
  width:"50%",
  gap:12
}
const right: React.CSSProperties = {
  display:"flex",
  alignItems:"center",
  justifyContent: "right",
  width:"25%",
  gap:12
}
const brand: React.CSSProperties = {
  fontWeight:700
}
const badge: React.CSSProperties = {
  fontSize:12,
  textTransform:"uppercase",
  padding:"2px 8px",
  borderRadius:999,
  background:"#f1f5f9",
  border:"1px solid #e2e8f0"
}
const nav: React.CSSProperties = {
  display:"flex",
  justifyContent:"center",
  flexFlow:"row wrap",
  gap:16,
  marginLeft:8,
  marginRight:8,
  paddingLeft:8,
  paddingRight:8,
  backgroundColor:"rgba(255,255,255,0.25)",
  borderRadius:"12px"
}
const activelink: React.CSSProperties = {
  backgroundColor:"#ffffff",
  color:"#434952",
  textDecoration:"none",
  paddingTop:"10px",
  paddingBottom:"10px",
  paddingLeft:"24px",
  paddingRight:"24px",
  marginTop:"6px",
  marginBottom:"6px",
  borderRadius:"12px"
}
const link: React.CSSProperties = {
  color:"#ffffff",
  textDecoration:"none",
  paddingTop:"12px",
  paddingBottom:"12px"
}

export function Header({ title="Vault", navLinks, showRole=true }: Props) {
  const role = useRole();

  return (
    <header style={bar}>
      <div style={left}>
        {<h2 style={brand}>{title}</h2>}
        {/*showRole && role && <span style={badge}>{role}</span>*/}
      </div>
      <div style={center}>
        {navLinks && navLinks.length > 0 && (
          <nav style={nav}>
            {navLinks.map((l) => (<a key={l.key} href={l.href} style={l.active ? activelink : link}><small>{l.label}</small></a>))}
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
