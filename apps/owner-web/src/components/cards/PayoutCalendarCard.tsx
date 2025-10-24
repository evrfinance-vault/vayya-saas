import React from "react";
import Card, { type CardSize } from "./Card";
import "./PayoutCalendarCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCaretDown,
  faCircle,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import {
  useOwnerPayoutsByDay,
  usePayoutsWindow,
} from "../../api/useOwnerPayoutsByDay";
import {
  startOfDay,
  addDays,
  startOfWeek,
  format,
  differenceInCalendarDays,
} from "date-fns";
import { fmtUSD } from "../../api/useTotalRevenue";

type Props = { width?: CardSize; height?: CardSize };
type ViewMode = "day" | "week" | "month";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PayoutCalendarCard({
  width = "4x",
  height = "3x",
}: Props) {
  const [view, setView] = React.useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  });

  const [mode, setMode] = React.useState<ViewMode>("month");
  const [focusDate, setFocusDate] = React.useState(new Date());

  const dayStart = startOfDay(focusDate);
  const dayEnd = addDays(dayStart, 1);
  const { items: dayItems } = usePayoutsWindow(
    dayStart.toISOString().slice(0, 10),
    dayEnd.toISOString().slice(0, 10),
  );

  const wkStart = startOfWeek(focusDate, { weekStartsOn: 0 });
  const wkEnd = addDays(wkStart, 7);
  const { items: weekItems } = usePayoutsWindow(
    format(wkStart, "yyyy-MM-dd"),
    format(wkEnd, "yyyy-MM-dd"),
  );

  type Opt = { value: string; label: string };
  const selectOptions = React.useMemo<Opt[]>(() => {
    const today = new Date();
    if (mode === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const opts: Opt[] = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        opts.push({
          value: `${y}-${m}`,
          label: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
        });
      }
      return opts;
    }
    if (mode === "week") {
      const start = startOfWeek(today, { weekStartsOn: 0 });
      const opts: Opt[] = [];
      for (let i = 0; i < 12; i++) {
        const s = addDays(start, i * 7);
        const e = addDays(s, 6);
        const label = `${format(s, "MMM d")} – ${format(e, "MMM d")}`;
        opts.push({ value: s.toISOString().slice(0, 10), label });
      }
      return opts;
    }

    const opts: Opt[] = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(today, i);
      opts.push({
        value: d.toISOString().slice(0, 10),
        label: format(d, "MMM d"),
      });
    }
    return opts;
  }, [mode]);

  const selectValue = React.useMemo(() => {
    if (mode === "month") return `${view.y}-${view.m}`;
    if (mode === "week")
      return startOfWeek(focusDate, { weekStartsOn: 0 })
        .toISOString()
        .slice(0, 10);
    return focusDate.toISOString().slice(0, 10);
  }, [mode, view, focusDate]);

  const { data, loading } = useOwnerPayoutsByDay(view.y, view.m);

  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const firstDow = new Date(view.y, view.m - 1, 1).getDay();

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const totals = data?.totals ?? {};

  const weekBuckets = React.useMemo(() => {
    const buckets = Array.from({ length: 7 }, (_, i) => ({
      date: addDays(wkStart, i),
      self: { count: 0, total: 0 },
      kayya: { count: 0, total: 0 },
    }));

    for (const it of weekItems ?? []) {
      const raw =
        (it as any).effectiveAt ??
        (it as any).paidAt ??
        (it as any).dueDate ??
        (it as any).ymd ??
        (it as any).iso;

      if (!raw) continue;

      const ymd =
        typeof raw === "string"
          ? raw.slice(0, 10)
          : new Date(raw).toISOString().slice(0, 10);
      const d = fromLocalYMD(ymd);
      const idx = differenceInCalendarDays(d, wkStart);

      if (idx < 0 || idx > 6) continue;

      const planType =
        (it as any).planType ??
        (it as any).paymentPlan?.planType ??
        (it as any).plan?.planType ??
        (it as any).type;
      const key = planType === "KAYYA" ? "kayya" : "self";
      const incCount = Number((it as any).count ?? 1);
      const incTotal = Number(
        (it as any).totalCents ??
          (it as any).amountCents ??
          (it as any).total ??
          (it as any).amount ??
          0,
      );

      (buckets[idx] as any)[key].count += incCount;
      (buckets[idx] as any)[key].total += incTotal;
    }

    return buckets;
  }, [weekItems, wkStart]);

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
    if (wrapW - hover.x < EST_W) tx = "-100%";
    if (hover.y < EDGE_Y) ty = "0";
    return {
      left: hover.x,
      top: hover.y - GAP_Y,
      transform: `translate(${tx},${ty})`,
      position: "absolute",
      pointerEvents: "none",
      zIndex: 2,
    };
  }

  function fromLocalYMD(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const header = (
    <div className="pc-head">
      <div className="pc-select-wrap">
        <select
          className="pc-month-select"
          value={selectValue}
          aria-label="Select period"
          onChange={(e) => {
            const v = e.target.value;
            if (mode === "month") {
              const [y, m] = v.split("-").map(Number);
              setView({ y, m });
            } else {
              setFocusDate(fromLocalYMD(v));
            }
          }}
        >
          {selectOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <FontAwesomeIcon
          icon={faCaretDown}
          className="pc-caret"
          aria-hidden="true"
        />
      </div>

      <div className="pc-seg" role="group" aria-label="Calendar view">
        <button
          type="button"
          className={mode === "day" ? "on" : ""}
          aria-pressed={mode === "day"}
          onClick={() => {
            setMode("day");
            setFocusDate(startOfDay(new Date()));
          }}
        >
          Day
        </button>
        <button
          type="button"
          className={mode === "week" ? "on" : ""}
          aria-pressed={mode === "week"}
          onClick={() => {
            setMode("week");
            setFocusDate(startOfDay(new Date()));
          }}
        >
          Week
        </button>
        <button
          type="button"
          className={mode === "month" ? "on" : ""}
          aria-pressed={mode === "month"}
          onClick={() => {
            setMode("month");
            const d = new Date();
            setView({ y: d.getFullYear(), m: d.getMonth() + 1 });
          }}
        >
          Month
        </button>
      </div>
    </div>
  );

  return (
    <Card
      title="Payout Calendar"
      icon={faCalendarDays}
      header={header}
      width={width}
      height={height}
    >
      {mode === "day" && (
        <div className="pc-day">
          <div className="pc-day-title">
            {format(dayStart, "EEEE MMM d, yyyy")}
          </div>
          <ul className="pc-day-list">
            {(dayItems ?? []).map((it: any, i: number) => {
              const plan =
                it.planType ?? it.paymentPlan?.planType ?? it.type ?? "SELF";
              return (
                <li
                  key={i}
                  className={`pc-day-item ${plan === "KAYYA" ? "kayya" : "self"}`}
                >
                  <span className="badge">
                    {plan === "KAYYA" ? "Kayya" : "Self"}
                  </span>
                  <span>{it.name}</span>
                  <span className="amt">
                    {fmtUSD(it.amountCents ?? it.amount ?? 0)}
                  </span>
                </li>
              );
            })}
            {(dayItems ?? []).length === 0 && (
              <li className="pc-day-empty">
                <em>No payouts today</em>
              </li>
            )}
          </ul>
        </div>
      )}

      {mode === "week" && (
        <div className="pc-week" ref={wrapRef}>
          <div className="pc-dow">
            {DOW.map((d) => (
              <div key={d} className="pc-dow-cell">
                {d}
              </div>
            ))}
          </div>

          <div className="pc-week-grid">
            {weekBuckets.map((b, i) => {
              const selfCount = b.self.count;
              const kayyaCount = b.kayya.count;
              return (
                <div key={i} className="pc-week-col">
                  <div className="pc-week-date">{format(b.date, "d")}</div>
                  <div className="pc-week-track">
                    {selfCount > 0 && (
                      <div
                        className="pc-week-dot self"
                        title={`${selfCount} payout${selfCount === 1 ? "" : "s"} • ${fmtUSD(b.self.total)}`}
                      >
                        {selfCount}
                      </div>
                    )}
                    {kayyaCount > 0 && (
                      <div
                        className="pc-week-dot kayya"
                        title={`${kayyaCount} payout${kayyaCount === 1 ? "" : "s"} • ${fmtUSD(b.kayya.total)}`}
                      >
                        {kayyaCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "month" && (
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
              <div className="fa-stack">
                <FontAwesomeIcon
                  icon={faCircle}
                  className="fa-stack-2x"
                  color="#000000"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="fa-stack-1x"
                  color="#f5c33b"
                />
              </div>
              {fmtUSD(hover.cents)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
