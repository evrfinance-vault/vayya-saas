import React from "react";
import "./Card.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export type CardSize = "1x" | "2x" | "3x" | "4x";
export type TitleAlignment = "left" | "center";

type Props = {
  title: string;
  icon?: IconProp;
  align?: TitleAlignment;
  width?: CardSize;
  height?: CardSize;
  children?: React.ReactNode;
};

export default function Card({
  title,
  icon,
  align = "left",
  width = "1x",
  height = "1x",
  children,
}: Props) {
  return (
    <div className={`overview-card card-w-${width} card-h-${height}`}>
      <div className={`card-align-${align}`}>
        {icon && (
          <span className="card-icon">
            <FontAwesomeIcon icon={icon} size="1x" />
          </span>
        )}
        <span className="card-title">{title}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}
