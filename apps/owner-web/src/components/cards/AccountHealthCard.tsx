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
        <div className="ah-ring-wrap">
          <div
            className="ah-ring"
            style={{ ["--seg-count" as any]: segs.length }}
          >
            {segs.map((h, i) => {
              const angle = (360 / segs.length) * i;
              const n = counts[h as Health] ?? 0;
              const title =
                n > 0
                  ? `${n} account${n === 1 ? "" : "s"} in ${LABEL[h as Health]} health`
                  : `No accounts in ${LABEL[h as Health]} health`;

              return (
                <span
                  key={i}
                  className={`ah-dot ${h.toLowerCase()}`}
                  style={{ ["--angle" as any]: `${angle}deg` }}
                  title={title}
                  aria-label={title}
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
