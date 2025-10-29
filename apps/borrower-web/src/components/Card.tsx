import React from "react";
import "./Card.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

export type CardSize = "025x" | "05x" | "1x" | "2x" | "3x" | "4x";
export type TitleAlignment = "left" | "center";

type Props = {
  backgroundColor?: string;
  title: string;
  titleColor?: string;
  icon?: IconProp;
  iconColor?: string;
  header?: React.ReactNode;
  align?: TitleAlignment;
  width?: CardSize;
  height?: CardSize;
  children?: React.ReactNode;
};

export default function Card({
  backgroundColor = "var(--light-color)",
  title,
  titleColor = "var(--dark-color)",
  icon,
  iconColor = "var(--alt-theme-color)",
  header,
  align = "left",
  width = "1x",
  height = "1x",
  children,
}: Props) {
  return (
    <section
      className={`admin-card card-w-${width} card-h-${height}`}
      style={{ backgroundColor: backgroundColor }}
    >
      <header className="card-header">
        <div className={`card-title card-align-${align}`}>
          {icon && (
            <span
              className="card-icon"
              style={{ backgroundColor: iconColor, color: backgroundColor }}
            >
              <FontAwesomeIcon icon={icon} size="1x" />
            </span>
          )}
          <h3 className={`card-align-${align}`} style={{ color: titleColor }}>
            {title}
          </h3>
        </div>
        {header && <div className="card-header-text">{header}</div>}
      </header>
      <div className="card-body">{children}</div>
    </section>
  );
}
