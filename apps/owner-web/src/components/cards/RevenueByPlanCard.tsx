import React from "react";
import Card, { type CardSize } from "../Card";
import "./RevenueByPlanCard.css";
import { faDollarSign } from "@fortawesome/free-solid-svg-icons";
import { useOwnerRevenueByPlan } from "../../api/useOwnerRevenueByPlan";

type Props = { width?: CardSize; height?: CardSize; weeks?: number };

export default function RevenueByPlanCard({
  width = "2x",
  height = "1x",
  weeks = 52,
}: Props) {
  const { data, loading } = useOwnerRevenueByPlan({ bucket: "week", weeks });

  const uid = React.useId().replace(/:/g, "");
  const gradSelfId = `rev-grad-self-${uid}`;
  const gradKayyaId = `rev-grad-kayya-${uid}`;

  const [hover, setHover] = React.useState<{
    idx: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);

  const header = (
    <div className="rev-legend">
      <span className="rev-key self" /> Self-financed
      <span className="rev-key legend kayya" /> Kayya-backed
    </div>
  );

  function parseYMDtoUTC(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  }

  const rawPoints = data?.points;
  const points = React.useMemo(() => rawPoints ?? [], [rawPoints]);
  const max = Math.max(1, Math.ceil((data?.max ?? 0) / 1000) * 1000);

  const monthTicks = React.useMemo(() => {
    const ticks: { idx: number; label: string }[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < points.length; i++) {
      const d = parseYMDtoUTC(points[i].date);

      const prev = i > 0 ? parseYMDtoUTC(points[i - 1].date) : undefined;

      const monthChanged =
        i === 0 || (prev && prev.getUTCMonth() !== d.getUTCMonth());

      if (monthChanged) {
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        if (!seen.has(key)) {
          const label = d.toLocaleString("en-US", {
            month: "short",
            timeZone: "UTC",
          });
          ticks.push({ idx: i, label });
          seen.add(key);
        }
      }
    }

    return ticks;
  }, [points]);

  const BAND = 50;

  const W = 900,
    H = 320,
    P = { t: 20, r: 24, b: 36, l: 48 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const stepVB = points.length > 1 ? innerW / (points.length - 1) : innerW;

  const x = (i: number) => P.l + (points.length > 1 ? i * stepVB : innerW / 2);
  const y = (v: number) => P.t + innerH - (max ? (v / max) * innerH : 0);

  function smoothPathFor(key: "self" | "kayya") {
    const n = points.length;
    if (n === 0) return "";

    const tension = 0.7;
    const pt = (i: number) => {
      const k = Math.max(0, Math.min(n - 1, i));
      return { x: x(k), y: y(points[k][key]) };
    };

    let d = `M ${pt(0).x},${pt(0).y}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pt(i - 1);
      const p1 = pt(i);
      const p2 = pt(i + 1);
      const p3 = pt(i + 2);

      const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
      const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
      const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
      const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  function onMove(e: React.MouseEvent<SVGRectElement, MouseEvent>) {
    if (points.length < 2 || !wrapRef.current) return;

    const rectBounds = e.currentTarget.getBoundingClientRect();
    const wrapBounds = wrapRef.current.getBoundingClientRect();

    const relX = e.clientX - rectBounds.left;
    const stepPX = rectBounds.width / (points.length - 1);

    let idx = Math.floor((relX + stepPX / 2) / stepPX);
    if (idx < 0) idx = 0;
    if (idx > points.length - 1) idx = points.length - 1;

    const mouseX = e.clientX - wrapBounds.left;
    const mouseY = e.clientY - wrapBounds.top;

    setHover({ idx, mouseX, mouseY });
  }

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);

  function fmtUSDk(dollars: number) {
    const k = dollars / 1000;
    return `$${k.toFixed(0)}k`;
  }

  let tipLeftPx: number | undefined;
  let tipTransformX = "translateX(-50%)";
  if (hover && wrapRef.current) {
    tipLeftPx = hover.mouseX;
    const wrapW = wrapRef.current.clientWidth;
    const EDGE = 90;
    if (tipLeftPx < EDGE) tipTransformX = "translateX(0)";
    else if (wrapW - tipLeftPx < EDGE) tipTransformX = "translateX(-100%)";
    else tipTransformX = "translateX(-50%)";
  }

  let tipTopPx: number | undefined;
  if (hover && wrapRef.current) {
    const GAP = 10;
    const tipH = tipRef.current?.offsetHeight ?? 34;
    let yPx = hover.mouseY - GAP;
    const EDGE_TOP = 6;
    if (yPx - tipH < EDGE_TOP) yPx = EDGE_TOP + tipH;
    tipTopPx = yPx;
  }

  const h = hover?.idx ?? null;

  function areaPathFor(key: "self" | "kayya") {
    const n = points.length;
    if (n === 0) return "";
    const d = smoothPathFor(key);
    const x0 = x(0);
    const xN = x(n - 1);
    const yBase = H - P.b;
    return `${d} L ${xN},${yBase} L ${x0},${yBase} Z`;
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
              aria-label="Weekly revenue by plan"
            >
              <defs>
                <linearGradient
                  id={gradSelfId}
                  x1="0"
                  y1={P.t}
                  x2="0"
                  y2={H - P.b}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#9dda8f" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#9dda8f" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id={gradKayyaId}
                  x1="0"
                  y1={P.t}
                  x2="0"
                  y2={H - P.b}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#accdea" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#accdea" stopOpacity="0" />
                </linearGradient>
              </defs>

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
                    <text x={P.l - 16} y={yy} className="rev-ytick">
                      {fmtUSDk(val)}
                    </text>
                  </g>
                );
              })}

              {monthTicks.map((t) => {
                const xx = x(t.idx);
                return (
                  <g key={t.idx} transform={`translate(${xx},0)`}>
                    <line
                      x1={0}
                      y1={H - P.b}
                      x2={0}
                      y2={H - P.b + 6}
                      className="rev-grid"
                    />
                    <text
                      x={0}
                      y={H - 10}
                      className="rev-xtick"
                      textAnchor="middle"
                    >
                      {t.label}
                    </text>
                  </g>
                );
              })}

              <path
                d={areaPathFor("self")}
                className="rev-area self"
                fill={`url(#${gradSelfId})`}
              />
              <path
                d={areaPathFor("kayya")}
                className="rev-area kayya"
                fill={`url(#${gradKayyaId})`}
              />

              <path d={smoothPathFor("self")} className="rev-line self" />
              <path d={smoothPathFor("kayya")} className="rev-line kayya" />

              {h !== null && (
                <g>
                  {(() => {
                    const xh = x(h);
                    const left = Math.max(P.l, xh - BAND / 2);
                    const right = Math.min(W - P.r, xh + BAND / 2);
                    const w = Math.max(0, right - left);
                    return (
                      <rect
                        x={left}
                        y={P.t}
                        width={w}
                        height={H - P.t * 2}
                        rx={0}
                        ry={0}
                        className="rev-hover-band"
                        pointerEvents="none"
                      />
                    );
                  })()}

                  <line
                    x1={x(h)}
                    y1={P.t}
                    x2={x(h)}
                    y2={H - P.t}
                    className="rev-hover-line"
                    pointerEvents="none"
                  />

                  <circle
                    cx={x(h)}
                    cy={y(points[h].self)}
                    r={5}
                    className="rev-dot self"
                    pointerEvents="none"
                  />
                  <circle
                    cx={x(h)}
                    cy={y(points[h].kayya)}
                    r={5}
                    className="rev-dot kayya"
                    pointerEvents="none"
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

            {hover && h !== null && (
              <div
                ref={tipRef}
                className="rev-tooltip"
                style={{
                  left: tipLeftPx,
                  top: tipTopPx,
                  transform: `${tipTransformX} translateY(-100%)`,
                }}
              >
                <div className="rev-tip-row">
                  <span className="rev-key self" /> {fmtUSD(points[h].self)}
                  <span className="rev-key legend kayya" />{" "}
                  {fmtUSD(points[h].kayya)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
