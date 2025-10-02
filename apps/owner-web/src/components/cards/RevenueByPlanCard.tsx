import React from "react";
import Card, { type CardSize } from "../Card";
import "./RevenueByPlanCard.css";
import { faDollarSign } from "@fortawesome/free-solid-svg-icons";
import { useOwnerRevenueByPlan } from "../../api/useOwnerRevenueByPlan";

type Props = { width?: CardSize; height?: CardSize; months?: number };

export default function RevenueByPlanCard({
  width = "2x",
  height = "1x",
  months = 12,
}: Props) {
  const { data, loading } = useOwnerRevenueByPlan(months);

  // hooks must be before any conditional return
  const [hover, setHover] = React.useState<number | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null); // 👈 container for width

  const header = (
    <div className="rev-legend">
      <span className="rev-key legend self" /> Self-Financed
      <span className="rev-key legend kayya" /> Kayya-Backed
    </div>
  );

  const points = data?.points ?? [];
  const max = Math.max(1, Math.ceil((data?.max ?? 0) / 1000) * 1000);

  const W = 900,
    H = 320,
    P = { t: 20, r: 24, b: 36, l: 48 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const stepVB = points.length > 1 ? innerW / (points.length - 1) : innerW;

  const x = (i: number) => P.l + (points.length > 1 ? i * stepVB : innerW / 2);
  const y = (v: number) => P.t + innerH - (max ? (v / max) * innerH : 0);

  const pathFor = (key: "self" | "kayya") =>
    points.length
      ? points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key])}`).join(" ")
      : "";

  function onMove(e: React.MouseEvent<SVGRectElement, MouseEvent>) {
    if (points.length < 2) return;
    const rectEl = e.currentTarget;
    const bounds = rectEl.getBoundingClientRect();
    const relX = e.clientX - bounds.left; // 0..bounds.width (px)
    const stepPX = bounds.width / (points.length - 1); // px per month
    let idx = Math.floor((relX + stepPX / 2) / stepPX); // bucket center
    if (idx < 0) idx = 0;
    if (idx > points.length - 1) idx = points.length - 1;
    setHover(idx);
  }

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  const h = hover; // null when not hovering

  // compute tooltip alignment to avoid cropping
  let tipLeftPct = 50;
  let tipTransform = "translateX(-50%)";
  if (h !== null) {
    tipLeftPct = (x(h) / W) * 100;
    const wrapW = wrapRef.current?.clientWidth ?? 0;
    const pxLeft = (tipLeftPct / 100) * wrapW;
    const EDGE = 90; // px guard
    if (wrapW) {
      if (pxLeft < EDGE) {
        tipTransform = "translateX(0)"; // pin to left
      } else if (wrapW - pxLeft < EDGE) {
        tipTransform = "translateX(-100%)"; // pin to right
      } else {
        tipTransform = "translateX(-50%)"; // centered
      }
    }
  }

  return (
    <Card
      title="Total Revenue by Plan"
      icon={faDollarSign}
      header={header}
      width={width}
      height={height}
    >
      <div className="rev-wrap" ref={wrapRef}>
        {loading || !data ? (
          <div className="rev-skel">Loading…</div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="rev-svg"
              role="img"
              aria-label="Revenue by plan"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const val = Math.round(max * t);
                const yy = y(val);
                return (
                  <g key={i}>
                    <line
                      x1={P.l}
                      y1={yy}
                      x2={W - P.r}
                      y2={yy}
                      className="rev-grid"
                    />
                    <text x={P.l - 8} y={yy} className="rev-ytick">
                      {fmtUSD(val)}
                    </text>
                  </g>
                );
              })}
              {points.map((p, i) => (
                <text key={i} x={x(i)} y={H - 10} className="rev-xtick">
                  {p.label}
                </text>
              ))}

              <path d={pathFor("self")} className="rev-line self" />
              <path d={pathFor("kayya")} className="rev-line kayya" />

              {h !== null && (
                <g>
                  <line
                    x1={x(h)}
                    y1={P.t}
                    x2={x(h)}
                    y2={H - P.b}
                    className="rev-hover-line"
                  />
                  <circle
                    cx={x(h)}
                    cy={y(points[h].self)}
                    r={5}
                    className="rev-dot self"
                  />
                  <circle
                    cx={x(h)}
                    cy={y(points[h].kayya)}
                    r={5}
                    className="rev-dot kayya"
                  />
                </g>
              )}

              <rect
                x={P.l}
                y={P.t}
                width={innerW}
                height={innerH}
                className="rev-hit"
                onMouseMove={onMove}
                onMouseLeave={() => setHover(null)}
              />
            </svg>

            {h !== null && (
              <div
                className="rev-tooltip"
                style={{ left: `${tipLeftPct}%`, transform: tipTransform }}
              >
                <div className="rev-tip-row">
                  <span className="rev-key self" /> {fmtUSD(points[h].self)}{" "}
                  <span className="rev-tip-label">Self-Financed</span>
                </div>
                <div className="rev-tip-row">
                  <span className="rev-key kayya" /> {fmtUSD(points[h].kayya)}{" "}
                  <span className="rev-tip-label">Kayya-Backed</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
