import React from "react";
import "./OverviewTabs.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

export type TabKey =
  | "total-revenue"
  | "active-payment-plans"
  | "kayya-board"
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

  const [openFor, setOpenFor] = React.useState<TabKey | null>(null);

  const toggleMenu = React.useCallback(
    (key: TabKey) => {
      setOpenFor((cur) => (cur === key ? null : key));
      onOptions?.(key);
    },
    [onOptions],
  );

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const root = listRef.current;
      if (!root) return;
      const target = e.target as Node;

      const menu = root.querySelector(".overview-tab-menu");
      const btn = root.querySelector(".overview-tab-options");
      const clickedInside =
        (!!menu && menu.contains(target)) || (!!btn && btn.contains(target));

      if (!clickedInside) setOpenFor(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          const showOptions = selected && tab.key === "total-revenue";
          const menuOpen = openFor === tab.key;

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
                <span className="overview-tab-badge">{tab.badge}</span>
              </div>

              {showOptions && (
                <button
                  type="button"
                  className="overview-tab-options"
                  aria-label={`${tab.label} options`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleMenu(tab.key);
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} size="lg" />
                </button>
              )}

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

              {menuOpen && (
                <div
                  role="menu"
                  className="overview-tab-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button role="menuitem" className="overview-tab-menu-item">
                    Export CSV
                  </button>
                  <button role="menuitem" className="overview-tab-menu-item">
                    Export PDF
                  </button>
                  <button role="menuitem" className="overview-tab-menu-item">
                    Print
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="overview-tab-background" />
    </div>
  );
}
