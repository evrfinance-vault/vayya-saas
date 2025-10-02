import React from "react";
import Card, { type CardSize } from "../Card";
import "./NameCard.css";
import { useOwnerOverviewName } from "../../api/useOwnerOverviewName";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";

type Props = {
  width?: CardSize;
  height?: CardSize;
  limit?: number;
};

export default function NameCard({
  width = "1x",
  height = "1x",
  limit = 10,
}: Props) {
  const { items, loading } = useOwnerOverviewName(limit);

  return (
    <Card
      title="Name"
      icon={faCircleUser}
      header={<span>Net payout</span>}
      width={width}
      height={height}
    >
      {loading ? (
        <div className="namecard-skel">Loading…</div>
      ) : (
        <ul className="namecard-list" role="list">
          {items.map((it) => (
            <li key={it.id} className="namecard-row">
              <span className="namecard-avatar" aria-hidden="true">
                {it.initials}
              </span>

              <div className="namecard-main">
                <div className="namecard-title" title={it.name}>
                  {it.name}
                </div>
                <div className="namecard-desc">{it.methodLabel}</div>
              </div>

              <div className="namecard-right">
                <div className="namecard-amount">{fmtUSD(it.amount)}</div>
                <span className={`namecard-badge ${slug(it.badge)}`}>
                  {it.badge}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function fmtUSD(dollars: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
