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

export default function NameCard({ width = "1x", height = "1x", limit = 50 }: Props) {
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
                {initials(it.firstName, it.lastName)}
              </span>

              <div className="namecard-main">
                <div className="namecard-title" title={`${it.firstName} ${it.lastName}`.trim()}>
                  {it.firstName} {it.lastName}
                </div>
                {it.description && <div className="namecard-desc">{it.description}</div>}
              </div>

              <div className="namecard-right">
                <div className="namecard-amount">{fmtUSD(it.amountCents)}</div>
                {it.badge && (
                  <span className={`namecard-badge ${slug(it.badge)}`}>{it.badge}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* helpers */
function initials(f?: string, l?: string) {
  const a = (f ?? "").trim(), b = (l ?? "").trim();
  return `${(a[0] ?? "?").toUpperCase()}${(b[0] ?? "").toUpperCase()}`;
}
function fmtUSD(cents: number) {
  const dollars = Math.round(cents / 100);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(dollars);
}
function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
