import React from "react";
import Card, { type CardSize } from "../Card";
import "./AccountHealthCard.css";
import { faHeartPulse } from "@fortawesome/free-solid-svg-icons";
import { useOwnerAccountHealth } from "../../api/useOwnerAccountHealth";

type Props = { width?: CardSize; height?: CardSize };

export default function AccountHealthCard({
  width = "1x",
  height = "1x",
}: Props) {
  const { data, loading } = useOwnerAccountHealth();

  type Health = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  const LABEL: Record<Health, string> = {
    EXCELLENT: "excellent",
    GOOD: "good",
    FAIR: "fair",
    POOR: "poor",
  };

  const SEGMENTS = 24;

  function segments() {
    if (!data || data.totalPlans === 0) {
      return Array.from({ length: SEGMENTS }, () => "EMPTY");
    }
    const { byHealth } = data;
    const total = data.totalPlans;

    const targetCounts: Record<string, number> = {
      EXCELLENT: Math.round((byHealth.EXCELLENT / total) * SEGMENTS),
      GOOD: Math.round((byHealth.GOOD / total) * SEGMENTS),
      FAIR: Math.round((byHealth.FAIR / total) * SEGMENTS),
      POOR: Math.round((byHealth.POOR / total) * SEGMENTS),
    };

    const keys = ["EXCELLENT", "GOOD", "FAIR", "POOR"] as const;
    let sum = keys.reduce((s, k) => s + targetCounts[k], 0);
    while (sum > SEGMENTS) {
      const k = keys.reduce(
        (m, k) => (targetCounts[k] < targetCounts[m] ? k : m),
        "POOR" as const,
      );
      targetCounts[k]--;
      sum--;
    }
    while (sum < SEGMENTS) {
      const k = ["EXCELLENT", "GOOD", "FAIR", "POOR"].reduce(
        (m, k) =>
          targetCounts[k as keyof typeof targetCounts] >
          targetCounts[m as keyof typeof targetCounts]
            ? k
            : m,
        "EXCELLENT",
      );
      targetCounts[k]++;
      sum++;
    }

    const arr: Array<"EXCELLENT" | "GOOD" | "FAIR" | "POOR"> = [];
    keys.forEach((k) => {
      for (let i = 0; i < targetCounts[k]; i++) arr.push(k);
    });
    return arr;
  }

  const counts: Record<Health, number> = data
    ? {
        EXCELLENT: data.byHealth.EXCELLENT,
        GOOD: data.byHealth.GOOD,
        FAIR: data.byHealth.FAIR,
        POOR: data.byHealth.POOR,
      }
    : { EXCELLENT: 0, GOOD: 0, FAIR: 0, POOR: 0 };

  const segs = segments();

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  function onDotEnter(e: React.MouseEvent<HTMLSpanElement>, label: string) {
    if (!wrapRef.current) return;
    const wb = wrapRef.current.getBoundingClientRect();
    const cb = (e.currentTarget as HTMLSpanElement).getBoundingClientRect();
    const cx = cb.left + cb.width / 2 - wb.left;
    const cy = cb.top + cb.height / 2 - wb.top;
    setHover({ x: cx, y: cy, text: label });
  }
  function onDotLeave() {
    setHover(null);
  }

  function tipStyle(): React.CSSProperties {
    if (!hover || !wrapRef.current) return {};
    const wrap = wrapRef.current;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;

    const GAP = 10;
    const EDGE = 80;

    const isTopHalf = hover.y < h / 2;

    let tx = "-50%";
    let ty = "-100%";
    let top = hover.y - GAP;

    if (isTopHalf) {
      ty = "0";
      top = hover.y + GAP;
    }

    if (hover.x < EDGE) tx = "0";
    else if (w - hover.x < EDGE) tx = "-100%";

    return {
      left: hover.x,
      top,
      transform: `translate(${tx},${ty})`,
      position: "absolute",
      pointerEvents: "none",
      zIndex: 10,
    };
  }

  type TrapezoidOpts = {
    cx: number;
    cy: number;
    radius: number;
    topWidth: number;
    bottomWidth: number;
    height: number;
    r: number;
  };

  function roundedTrapezoidD(o: TrapezoidOpts): string {
    const { cx, cy, radius, topWidth, bottomWidth, height } = o;
    const r = Math.min(
      o.r,
      topWidth / 2 - 1,
      bottomWidth / 2 - 1,
      height / 2 - 1,
    );

    const x1 = cx - topWidth / 2;
    const y1 = cy - radius;
    const x2 = cx + topWidth / 2;
    const y2 = y1;
    const x3 = cx + bottomWidth / 2;
    const y3 = y1 + height;
    const x4 = cx - bottomWidth / 2;
    const y4 = y3;

    return [
      `M ${x1 + r} ${y1}`,
      `L ${x2 - r} ${y2}`,
      `Q ${x2} ${y2} ${x2} ${y2 + r}`,
      `L ${x3} ${y3 - r}`,
      `Q ${x3} ${y3} ${x3 - r} ${y3}`,
      `L ${x4 + r} ${y4}`,
      `Q ${x4} ${y4} ${x4} ${y4 - r}`,
      `L ${x1} ${y1 + r}`,
      `Q ${x1} ${y1} ${x1 + r} ${y1}`,
      `Z`,
    ].join(" ");
  }

  return (
    <Card
      title="Account Health"
      icon={faHeartPulse}
      width={width}
      height={height}
    >
      {loading ? (
        <div className="ah-skel">Loading…</div>
      ) : (
        <div className="ah-ring-wrap" ref={wrapRef}>
          <div
            className="ah-ring"
            style={{ ["--seg-count" as any]: segs.length }}
          >
            <svg className="ah-svg" viewBox="0 0 1000 1000" aria-hidden="true">
              {segs.map((h, i) => {
                const angle = (360 / segs.length) * i;

                const isHealth = (
                  ["EXCELLENT", "GOOD", "FAIR", "POOR"] as const
                ).includes(h as any);
                const hh = isHealth ? (h as Health) : null;
                const n = hh ? (counts[hh] ?? 0) : 0;
                const label = hh
                  ? n > 0
                    ? `${n} account${n === 1 ? "" : "s"} in ${LABEL[hh]} health`
                    : `No accounts in ${LABEL[hh]} health`
                  : "";

                return (
                  <g
                    key={i}
                    transform={`rotate(${angle} 500 500)`}
                    className="ah-knob-wrap"
                    onMouseEnter={
                      isHealth ? (e) => onDotEnter(e, label) : undefined
                    }
                    onMouseLeave={isHealth ? onDotLeave : undefined}
                  >
                    <path
                      className={`ah-knob ${String(h).toLowerCase()}`}
                      d={roundedTrapezoidD({
                        cx: 500,
                        cy: 500,
                        radius: 420,
                        topWidth: 90,
                        bottomWidth: 75,
                        height: 120,
                        r: 9999,
                      })}
                      aria-label={label}
                      data-tip={label}
                      role="img"
                      tabIndex={-1}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="ah-center">
              <div className="ah-total">
                {fmtUSDk(data?.totalPrincipalCents ?? 0)}
              </div>
              <div className="ah-sub">Total loans</div>
            </div>
          </div>

          {hover && (
            <div className="ah-tip" style={tipStyle()}>
              {hover.text}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function fmtUSDk(cents: number) {
  const dollars = Math.round(cents / 100);
  const k = dollars / 1000;
  return `$${k.toFixed(0)}k`;
}
