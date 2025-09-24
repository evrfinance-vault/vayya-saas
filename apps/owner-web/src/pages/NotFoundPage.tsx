import React from "react";

export default function NotFoundPage(): React.ReactElement {
  return (
    <div
      style={{
        padding: 24,
        marginLeft: 12,
        marginTop: 24,
        display: "grid",
        gap: 0,
      }}
    >
      <div className="preheading" style={{ fontSize: "small" }}>
        404
      </div>
      <h1 className="heading">Page Not Found</h1>
    </div>
  );
}
