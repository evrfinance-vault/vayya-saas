import React from "react";
import "./OverviewTabs.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

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
  badge?: number | string;
};

type Props = {
  tabs: TabDef[];
  value: TabKey;
  onChange: (key: TabKey) => void;
};

export default function OverviewTabs({ tabs, value, onChange }: Props) {
  return (
    <div className="wrapper">
      <div
        className="overview-tabs"
        role="tablist"
        aria-label="Overview sections"
      >
        {tabs.map((tab) => {
          const selected = tab.key === value;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              disabled={selected}
              aria-selected={selected}
              aria-controls={`panel-${tab.key}`}
              className="overview-tab"
              onClick={() => onChange(tab.key)}
            >
              <span className="overview-tab-icon">
                <FontAwesomeIcon icon={tab.icon} fixedWidth size="2x" />
              </span>
              <span className="overview-tab-label">
                {tab.label}
                <br />
                {tab.badge !== undefined && (
                  <span className="overview-tab-badge">{tab.badge}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overview-tab-background"></div>
    </div>
  );
}
