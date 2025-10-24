import React from "react";
import Card from "../cards/Card";
import { useAuth0 } from "@auth0/auth0-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsersGear } from "@fortawesome/free-solid-svg-icons";
import { useApiFetch } from "../../api/http";

export default function SettingsAccountPanel() {
  const apiFetch = useApiFetch();
  const { user } = useAuth0();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const userId = user?.sub ?? "";

  React.useEffect(() => {
    if (!userId || loaded) return;
    apiFetch(`/api/settings/account?userId=${encodeURIComponent(userId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((j) => {
        setName(j?.name ?? "");
        setEmail(j?.email ?? "");
      })
      .catch(() => {/* noop */})
      .finally(() => setLoaded(true));
  }, [userId, loaded]);

  const onSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const r = await apiFetch("/api/settings/account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, name, email }),
      });
      if (!r.ok) throw new Error(await r.text());
      alert("Saved!");
    } catch (e: any) {
      alert(`Save failed: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overview-grid">
      <Card backgroundColor="var(--background-color)" />
      <Card
        title="Login Details"
        icon={faUsersGear}
        width="2x"
        height="1x"
      >
        <div>
          <label className="form-label">Full name</label>
          <input
            className="form-input"
            type="text"
            value={(user?.given_name ?? user?.name ?? "").trim()}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
          />

          <label className="form-label">Email address</label>
          <input
            className="form-input"
            type="email"
            value={(user?.email ?? "").trim()}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
          />

          <div className="btn-wrapper">
            <button className="btn" onClick={onSave} disabled={saving || !userId}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
