import React from "react";
import Card, { type CardSize } from "../Card";
import "./InfoCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

type ValueKind = "money" | "percent" | "number";

export type InfoCardProps = {
  title: string;
  titleColor?: string;
  icon?: IconProp;
  iconColor?: string;
  value: number;
  kind?: ValueKind;
  valueColor?: string;
  subtext?: string;
  subIcon?: IconProp;
  subColor?: string;
  width?: CardSize;
  height?: CardSize;
};

export default function InfoCard({
  title,
  titleColor = "rgb(var(--dark-color-rgb) / 75%)",
  icon,
  iconColor = "var(--alt-theme-color)",
  value,
  kind = "money",
  valueColor = "var(--dark-color)",
  subtext,
  subIcon,
  subColor = "var(--dark-color)",
  width = "1x",
  height = "05x",
}: InfoCardProps) {
  const headerRight = null;

  function fmt() {
    if (kind === "money") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
    if (kind === "percent") return `${value.toFixed(1)}%`;
    return new Intl.NumberFormat("en-US").format(value);
  }

  return (
    <Card
      title={title}
      titleColor={titleColor}
      icon={icon}
      iconColor={iconColor}
      header={headerRight}
      width={width}
      height={height}
    >
      <div className="ic-wrap">
        <div className="ic-value" style={{ color: valueColor }}>
          {fmt()}
        </div>
        {subtext && (
          <div className="ic-sub" style={{ color: subColor }}>
            {subIcon && (
              <FontAwesomeIcon icon={subIcon} className="ic-sub-ico" />
            )}{" "}
            {subtext}
          </div>
        )}
      </div>
    </Card>
  );
}
