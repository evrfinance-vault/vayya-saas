import React from "react";
import Card, { type CardSize } from "../Card";
import "./SpreadsheetCard.css";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import type { PlanKey } from "../../api/useTotalRevenue";

type Column<T> = {
  key: keyof T;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
  render?: (row: T) => React.ReactNode;
};

type RangeKey = "3m" | "6m" | "12m" | "ltd" | string;

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
  planValue?: PlanKey;
  onPlanChange?: (p: PlanKey) => void;
  rangeValue?: RangeKey;
  onRangeChange?: (r: RangeKey) => void;
  rangeOptions?: Array<RangeKey | { value: RangeKey; label: string }>;
  planOptions?: PlanKey[];
  statusValue?: string;
  onStatusChange?: (s: string) => void;
  statusOptions?: Array<string | { value: string; label: string }>;
  showStatusFilter?: boolean;
  headerControls?: React.ReactNode;
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
  planValue,
  onPlanChange,
  rangeValue,
  onRangeChange,
  rangeOptions = ["3m", "6m", "12m", "ltd"],
  planOptions = ["ALL", "SELF", "KAYYA"],
  statusValue,
  onStatusChange,
  statusOptions,
  showStatusFilter = false,
  headerControls,
}: Props<T>) {
  const [internalRange, setInternalRange] = React.useState<RangeKey>(
    rangeValue ?? "12m",
  );
  const [internalPlan, setInternalPlan] = React.useState<PlanKey>(
    planValue ?? "ALL",
  );

  React.useEffect(() => {
    if (rangeValue) setInternalRange(rangeValue);
  }, [rangeValue]);

  React.useEffect(() => {
    if (planValue) setInternalPlan(planValue);
  }, [planValue]);

  const range = rangeValue ?? internalRange;
  const setRange = onRangeChange ?? setInternalRange;

  const plan = planValue ?? internalPlan;
  const setPlan = onPlanChange ?? setInternalPlan;

  const rangeLabel = (r: RangeKey) => {
    switch (r) {
      case "3m":
        return "Last 3 months";
      case "6m":
        return "Last 6 months";
      case "12m":
        return "Last 12 months";
      case "ltd":
        return "Lifetime";
      default:
        return String(r);
    }
  };

  const planLabel = (p: PlanKey) =>
    p === "ALL"
      ? "All plans"
      : p === "KAYYA"
        ? "Kayya-backed"
        : "Self-financed";

  const colTemplate = React.useMemo(
    () => columns.map((c) => c.width ?? "minmax(0,1fr)").join(" "),
    [columns],
  );

  const defaultHeader = (
    <div className="ss-controls">
      <div className="ss-select-wrap">
        <select
          className="ss-select"
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
        >
          {(rangeOptions ?? ["3m", "6m", "12m", "ltd"]).map((opt) => {
            const val = typeof opt === "string" ? opt : opt.value;
            const lab =
              typeof opt === "string"
                ? rangeLabel(opt)
                : (opt.label ?? rangeLabel(opt.value));
            return (
              <option key={val} value={val}>
                {lab}
              </option>
            );
          })}
        </select>
        <FontAwesomeIcon
          icon={faCaretDown}
          className="ss-caret"
          aria-hidden="true"
        />
      </div>

      {showStatusFilter && (
        <div className="ss-select-wrap">
          <select
            className="ss-select"
            aria-label="Status filter"
            value={statusValue ?? "ALL"}
            onChange={(e) => onStatusChange?.(e.target.value)}
          >
            {(
              statusOptions ?? ["ALL", "ACTIVE", "HOLD", "DELINQUENT", "PAID"]
            ).map((opt) => {
              const val = typeof opt === "string" ? opt : opt.value;
              const lab =
                typeof opt === "string" ? opt : (opt.label ?? opt.value);
              return (
                <option key={val} value={val}>
                  {lab}
                </option>
              );
            })}
          </select>
          <FontAwesomeIcon
            icon={faCaretDown}
            className="ss-caret"
            aria-hidden="true"
          />
        </div>
      )}

      {showPlanFilter && (
        <div className="ss-select-wrap">
          <select
            className="ss-select"
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanKey)}
          >
            {planOptions.map((opt) => (
              <option key={opt} value={opt}>
                {planLabel(opt)}
              </option>
            ))}
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

  const header = headerControls ?? defaultHeader;

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
          <div
            className="ss-row ss-head"
            role="row"
            style={{ gridTemplateColumns: colTemplate }}
          >
            {columns.map((c) => (
              <div
                key={String(c.key)}
                role="columnheader"
                className={`ss-cell ${c.align ?? "left"} ${c.className ?? ""}`}
                style={{ color: rowHeaderColor }}
                title={c.label}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>

        <div className="ss-tbody" role="rowgroup">
          {rows.map((row, i) => (
            <div
              key={i}
              className="ss-row"
              role="row"
              style={{ gridTemplateColumns: colTemplate }}
            >
              {columns.map((c) => (
                <div
                  key={String(c.key)}
                  role="cell"
                  className={`ss-cell ${c.align ?? "left"} ${c.className ?? ""}`}
                  style={{ color: rowColor }}
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
