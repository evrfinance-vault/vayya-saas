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

  // build 28 segments, proportionally colored by health
  const SEGMENTS = 28;

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

    // adjust rounding so sum == SEGMENTS
    const keys = ["EXCELLENT", "GOOD", "FAIR", "POOR"] as const;
    let sum = keys.reduce((s, k) => s + targetCounts[k], 0);
    while (sum > SEGMENTS) {
      // trim from smallest
      const k = keys.reduce(
        (m, k) => (targetCounts[k] < targetCounts[m] ? k : m),
        "POOR" as const,
      );
      targetCounts[k]--;
      sum--;
    }
    while (sum < SEGMENTS) {
      // add to largest healthy first
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
                <span
                  key={i}
                  className={`ah-dot ${String(h).toLowerCase()}`}
                  style={{ ["--angle" as any]: `${angle}deg` }}
                  onMouseEnter={
                    isHealth ? (e) => onDotEnter(e, label) : undefined
                  }
                  onMouseLeave={isHealth ? onDotLeave : undefined}
                  aria-label={label || undefined}
                />
              );
            })}

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
  return `$${k.toFixed(1)}K`;
}
