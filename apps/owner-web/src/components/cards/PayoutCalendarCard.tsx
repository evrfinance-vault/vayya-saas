import React from "react";
import Card, { type CardSize } from "../Card";
import "./PayoutCalendarCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useOwnerPayoutsByDay } from "../../api/useOwnerPayoutsByDay";

type Props = { width?: CardSize; height?: CardSize };

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PayoutCalendarCard({
  width = "4x",
  height = "3x",
}: Props) {
  const [view, setView] = React.useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 }; // 1..12
  });
  const { data, loading } = useOwnerPayoutsByDay(view.y, view.m);

  const monthName = new Date(view.y, view.m - 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const firstDow = new Date(view.y, view.m - 1, 1).getDay(); // 0=Sun

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const totals = data?.totals ?? {};
  const fmtUSD = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(cents / 100);

  function prevMonth() {
    const d = new Date(view.y, view.m - 2, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }
  function nextMonth() {
    const d = new Date(view.y, view.m, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }

  const header = (
    <div className="pc-head">
      <div className="pc-month">{monthName}</div>
      <button
        type="button"
        className="pc-nav"
        onClick={prevMonth}
        aria-label="Previous month"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <button
        type="button"
        className="pc-nav"
        onClick={nextMonth}
        aria-label="Next month"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </div>
  );

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<{
    x: number;
    y: number;
    cents: number;
    day: number;
  } | null>(null);

  function enterCell(
    e: React.MouseEvent<HTMLDivElement>,
    day: number,
    cents: number,
  ) {
    if (!wrapRef.current) return;
    const wb = wrapRef.current.getBoundingClientRect();
    const cb = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = cb.left + cb.width / 2 - wb.left;
    const y = cb.top + cb.height / 2 - wb.top;
    setHover({ x, y, cents, day });
  }
  function leaveCell() {
    setHover(null);
  }

  function tipStyle(): React.CSSProperties {
    if (!hover || !wrapRef.current) return {};
    const wrapW = wrapRef.current.clientWidth;
    const EDGE_Y = 50;
    const GAP_Y = 12;
    const EST_W = 180;

    let tx = "0";
    let ty = "-100%";

    if (wrapW - hover.x < EST_W) {
      tx = "-100%";
    }
    if (hover.y < EDGE_Y) {
      ty = "0";
    }

    return {
      left: hover.x,
      top: hover.y - GAP_Y,
      transform: `translate(${tx},${ty})`,
      position: "absolute",
      pointerEvents: "none",
      zIndex: 2,
    };
  }

  return (
    <Card
      title="Payout Calendar"
      icon={faCalendarDays}
      header={header}
      width={width}
      height={height}
    >
      <div className="pc-wrap" ref={wrapRef}>
        <div className="pc-dow">
          {DOW.map((d) => (
            <div key={d} className="pc-dow-cell">
              {d}
            </div>
          ))}
        </div>

        <div className="pc-grid" aria-busy={loading}>
          {cells.map((c, i) => {
            if (c.day == null) return <div key={i} className="pc-cell" />;

            const cents = totals[c.day] ?? 0;
            const has = cents > 0;

            return (
              <div key={i} className="pc-cell">
                <div
                  className={`pc-dot ${has ? "has" : "none"}`}
                  onMouseEnter={
                    has ? (e) => enterCell(e, c.day!, cents) : undefined
                  }
                  onMouseLeave={has ? leaveCell : undefined}
                  aria-label={has ? fmtUSD(cents) : undefined}
                >
                  {c.day}
                </div>
              </div>
            );
          })}
        </div>

        {hover && (
          <div className="pc-tip" style={tipStyle()}>
            <div className="fa-stack" style={{ fontSize: "8px", lineHeight: 1 }}>
              <FontAwesomeIcon icon={faCircle} className="fa-stack-2x" color="#000000" />
              <FontAwesomeIcon icon={faStar} className="fa-stack-1x" color="#f5c33b" />
            </div>
            {fmtUSD(hover.cents)}
          </div>
        )}
      </div>
    </Card>
  );
}
