import React from "react";
import Card from "../cards/Card";
import {
  faLeftRight,
  faDollarSign,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

export default function PaymentPlansPanel() {
  return (
    <div className="overview-grid">
      <Card title="One Time" iconColor="var(--theme-color)" icon={faLeftRight}>
        <div className="payment-plans-wrapper">
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Create Transaction
          </button>
          <p>
            This is a single borrower transaction to be paid in full upon
            receipt.
          </p>
        </div>
      </Card>

      <Card title="In-House" icon={faDollarSign} width="2x">
        <div className="payment-plans-wrapper">
          <button>Create Payment Plan</button>
          <p>
            This is a recurring borrower payment plan to be paid in
            installments. Financing is provided directly by the small business.
          </p>
        </div>
      </Card>

      <Card
        title="Kayya-Backed"
        iconColor="var(--theme-color)"
        icon={faShieldHalved}
      >
        <div className="payment-plans-wrapper">
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Create Payment Plan
          </button>
          <p>
            This is a recurring borrower payment plan to be paid in
            installments.
            <br />
            <br />
            Financing is provided by Kayya.
          </p>
        </div>
      </Card>
    </div>
  );
}
