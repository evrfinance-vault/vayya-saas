import React from "react";
import "./PageTabs.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

export type TabKey = string;

export type TabDefinition = {
  key: TabKey;
  icon: IconProp;
  label: string;
  badge?: string;
};

type Props = {
  tabs: TabDefinition[];
  value: TabKey;
  onChange: (key: TabKey) => void;
};

export default function PageTabs({ tabs, value, onChange }: Props) {
  return (
    <div className="wrapper">
      <div className="page-tabs" role="tablist" aria-label="Page tabs">
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
              className="page-tab"
              onClick={() => onChange(tab.key)}
            >
              <div className="page-tab-box">
                {tab.icon && (
                  <span className="page-tab-icon" aria-hidden="true">
                    <FontAwesomeIcon icon={tab.icon} fixedWidth size="xl" />
                  </span>
                )}
                <span className="page-tab-label">{tab.label}</span>
                <span className="page-tab-badge">{tab.badge}</span>
              </div>

              {selected && (
                <>
                  <img
                    className="tab-cap tab-cap-left"
                    src="/assets/tab-curved-left.svg"
                    alt=""
                    aria-hidden="true"
                  />
                  <img
                    className="tab-cap tab-cap-right"
                    src="/assets/tab-curved-right.svg"
                    alt=""
                    aria-hidden="true"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="page-tab-background" />
    </div>
  );
}
