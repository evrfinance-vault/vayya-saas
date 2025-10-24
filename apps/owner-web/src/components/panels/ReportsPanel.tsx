import React from "react";
import Card from "../cards/Card";
import {
  faMoneyBillTrendUp,
  faBuildingColumns,
  faSackDollar,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";

export default function ReportsPanel() {
  return (
    <div className="overview-grid">
      <Card title="Total Revenue" icon={faMoneyBillTrendUp}>
        <div className="reports-wrapper">
          <button>Print Report</button>
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Export to CSV
          </button>
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Export to PDF
          </button>
        </div>
      </Card>

      <Card title="Payment Plans" icon={faBuildingColumns}>
        <div className="reports-wrapper">
          <button>Print Report</button>
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Export to CSV
          </button>
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Export to PDF
          </button>
        </div>
      </Card>

      <Card title="Payments" icon={faSackDollar}>
        <div className="reports-wrapper">
          <button>Print Report</button>
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Export to CSV
          </button>
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Export to PDF
          </button>
        </div>
      </Card>

      <Card title="Applications" icon={faFileLines}>
        <div className="reports-wrapper">
          <button>Print Report</button>
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Export to CSV
          </button>
          <button style={{ backgroundColor: "var(--theme-color)" }}>
            Export to PDF
          </button>
        </div>
      </Card>
    </div>
  );
}
