import React from "react";
import Card, { type CardSize } from "../Card";
import "./SpreadsheetCard.css";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";

type Column<T> = {
  key: keyof T;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
};

type Props<T extends object> = {
  title: string;
  titleColor?: string;
  icon?: IconProp;
  iconColor?: string;
  rowHeaderColor?: string;
  rowColor?: string;
  width?: CardSize;
  height?: CardSize;
  columns: Column<T>[];
  rows: T[];
  showPlanFilter?: boolean;
  onPlanChange?: (p: "ALL" | "SELF" | "KAYYA") => void;
  onRangeChange?: (r: "3m" | "6m" | "12m" | "ytd") => void;
};

export default function SpreadsheetCard<T extends object>({
  title,
  titleColor = "rgb(var(--dark-color-rgb) / 75%)",
  icon,
  iconColor = "var(--alt-theme-color)",
  rowHeaderColor = "var(--dark-color)",
  rowColor = "var(--dark-color)",
  width = "4x",
  height = "3x",
  columns,
  rows,
  showPlanFilter = true,
  onPlanChange,
  onRangeChange,
}: Props<T>) {
  const header = (
    <div className="ss-controls">
      <div className="ss-select-wrap">
        <select
          className="ss-select"
          defaultValue="12m"
          onChange={(e) => onRangeChange?.(e.target.value as any)}
        >
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
          <option value="12m">Last 12 months</option>
          <option value="ytd">Year to date</option>
        </select>
        <FontAwesomeIcon
          icon={faCaretDown}
          className="ss-caret"
          aria-hidden="true"
        />
      </div>
      {showPlanFilter && (
        <div className="ss-select-wrap">
          <select
            className="ss-select"
            defaultValue="ALL"
            onChange={(e) => onPlanChange?.(e.target.value as any)}
          >
            <option value="ALL">All plans</option>
            <option value="KAYYA">Kayya-backed</option>
            <option value="SELF">Self-financed</option>
          </select>
          <FontAwesomeIcon
            icon={faCaretDown}
            className="ss-caret"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );

  return (
    <Card
      title={title}
      titleColor={titleColor}
      icon={icon}
      iconColor={iconColor}
      header={header}
      width={width}
      height={height}
    >
      <div className="ss-table" role="table" aria-label={title}>
        <div className="ss-thead" role="rowgroup">
          <div className="ss-row ss-head" role="row">
            {columns.map((c) => (
              <div
                key={String(c.key)}
                role="columnheader"
                className={`ss-cell ${c.align ?? "left"}`}
                style={{ width: c.width, color: rowHeaderColor }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>
        <div className="ss-tbody" role="rowgroup">
          {rows.map((row, i) => (
            <div key={i} className="ss-row" role="row">
              {columns.map((c) => (
                <div
                  key={String(c.key)}
                  role="cell"
                  className={`ss-cell ${c.align ?? "left"}`}
                  style={{ width: c.width, color: rowColor }}
                >
                  {c.render ? c.render(row) : String(row[c.key])}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
