import React from "react";
import Card, { type CardSize } from "./Card";
import "./NoticeCard.css";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

type Props = {
  backgroundColor?: string;
  title: string;
  titleColor?: string;
  icon?: IconProp;
  iconColor?: string;
  width?: CardSize;
  height?: CardSize;
};

export default function NoticeCard({
  backgroundColor = "var(--light-color)",
  title,
  titleColor = "var(--dark-color)",
  icon,
  iconColor = "var(--alt-theme-color)",
  width = "4x",
  height = "025x",
}: Props) {
  return (
    <Card
      backgroundColor={backgroundColor}
      title={title}
      titleColor={titleColor}
      icon={icon}
      iconColor={iconColor}
      width={width}
      height={height}
    />
  );
}
