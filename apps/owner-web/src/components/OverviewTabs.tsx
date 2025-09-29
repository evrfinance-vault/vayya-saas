import React from "react";
import "./OverviewTabs.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

export type TabKey =
  | "total-revenue"
  | "active-payment-plans"
  | "vayya-board"
  | "late-payments"
  | "pending-applications";

export type TabDef = {
  key: TabKey;
  icon: IconProp;
  label: string;
  badge?: string;
};

type Props = {
  tabs: TabDef[];
  value: TabKey;
  onChange: (key: TabKey) => void;
  onOptions?: (key: TabKey) => void;
};

export default function OverviewTabs({
  tabs,
  value,
  onChange,
  onOptions,
}: Props) {
  const listRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="wrapper">
      <div
        className="overview-tabs"
        role="tablist"
        aria-label="Overview sections"
        ref={listRef}
      >
        {tabs.map((tab) => {
          const selected = tab.key === value;
          return (
            <div
              key={tab.key}
              role="tab"
              tabIndex={selected ? 0 : -1}
              aria-disabled={selected}
              aria-selected={selected}
              aria-controls={`panel-${tab.key}`}
              className="overview-tab"
              onClick={() => onChange(tab.key)}
            >
              <div className="overview-tab-box">
                {tab.icon && (
                  <span className="overview-tab-icon" aria-hidden="true">
                    <FontAwesomeIcon icon={tab.icon} fixedWidth size="xl" />
                  </span>
                )}
                <span className="overview-tab-label">{tab.label}</span>
                {tab.badge && (
                  <span className="overview-tab-badge">{tab.badge}</span>
                )}
              </div>

              {selected && (
                <button
                  type="button"
                  className="overview-tab-options"
                  aria-label={`${tab.label} options`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOptions?.(tab.key);
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} size="lg" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="overview-tab-background" />
    </div>
  );
}
