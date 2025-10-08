import React from "react";
import "./Card.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export type CardSize = "1x" | "2x" | "3x" | "4x";
export type TitleAlignment = "left" | "center";

type Props = {
  title: string;
  icon?: IconProp;
  header?: React.ReactNode;
  align?: TitleAlignment;
  width?: CardSize;
  height?: CardSize;
  children?: React.ReactNode;
};

export default function Card({
  title,
  icon,
  header,
  align = "left",
  width = "1x",
  height = "1x",
  children,
}: Props) {
  return (
    <section className={`overview-card card-w-${width} card-h-${height}`}>
      <header className="card-header">
        <div className={`card-title card-align-${align}`}>
          {icon && (
            <span className="card-icon">
              <FontAwesomeIcon icon={icon} size="1x" />
            </span>
          )}
          <h3 className={`card-align-${align}`}>{title}</h3>
        </div>
        {header && <div className="card-header-text">{header}</div>}
      </header>
      <div className="card-body">{children}</div>
    </section>
  );
}
