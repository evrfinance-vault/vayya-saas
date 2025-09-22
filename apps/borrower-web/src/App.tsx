import React, { useState } from "react";
import { useApi, Header } from "@packages/ui-auth";

export default function App() {
  const api = useApi();
  const [pong, setPong] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ping() {
    try {
      setBusy(true);
      setErr(null);

      const data = await api("/api/ping");
      setPong(data);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Header
        title="Vayya"
        navLinks={[{ label: "Overview", href: "http://localhost:5174" }]}
      />
      <div style={{ padding: 24, display: "grid", gap: 12 }}>
        <h1>Vayya Borrower Dashboard</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={ping} disabled={busy}>
            {busy ? "Pinging…" : "Ping API"}
          </button>
        </div>
        {err && (
          <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{err}</pre>
        )}
        {pong && (
          <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(pong, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
