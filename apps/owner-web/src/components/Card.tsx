import React from "react";
import "./Card.css";

export default function Card({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="overview-card">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
