import React from "react";
import Card from "../cards/Card";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { useApiFetch } from "../../api/http";

type Testimonial = { author: string; quote: string };

export default function DiscoveryProfilePanel() {
  const apiFetch = useApiFetch();
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [hours, setHours] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [services, setServices] = React.useState<string>("");
  const [financing, setFinancing] = React.useState<string>("");
  const [testimonials, setTestimonials] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiFetch("/api/settings/discovery-profile")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((row) => {
        if (!row) return;
        setName(row.name ?? "");
        setAddress(row.address ?? "");
        setHours(row.hours ?? "");
        setWebsite(row.website ?? "");
        setServices(Array.isArray(row.services) ? row.services.join(", ") : "");
        setFinancing(
          Array.isArray(row.financingOptions)
            ? row.financingOptions.join(", ")
            : "",
        );
        if (Array.isArray(row.testimonials)) {
          const txt = row.testimonials
            .map((t: Testimonial) => `${t.author}: ${t.quote}`)
            .join("\n");
          setTestimonials(txt);
        }
      })
      .catch(() => {
        /* noop */
      });
  }, [apiFetch]);

  const onSave = async () => {
    setSaving(true);
    try {
      const svc = services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const fin = financing
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const tms = testimonials
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf(":");
          return idx > 0
            ? {
                author: line.slice(0, idx).trim(),
                quote: line.slice(idx + 1).trim(),
              }
            : { author: "Anonymous", quote: line };
        });

      const r = await apiFetch("/api/settings/discovery-profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          hours,
          website,
          services: svc,
          financingOptions: fin,
          testimonials: tms,
        }),
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
      <Card title="Business Info" icon={faCircleInfo} width="4x" height="2x">
        <div>
          <div className="grid-2">
            <div>
              <label className="form-label">Business name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label className="form-label">Address</label>
              <input
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <label className="form-label">Hours</label>
              <input
                className="form-input"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />

              <label className="form-label">Website</label>
              <input
                className="form-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Services (comma-separated)</label>
              <input
                className="form-input"
                value={services}
                onChange={(e) => setServices(e.target.value)}
              />

              <label className="form-label">
                Financing options (comma-separated)
              </label>
              <input
                className="form-input"
                value={financing}
                onChange={(e) => setFinancing(e.target.value)}
              />

              <label className="form-label">
                Testimonials (one per line as “Name: Quote”)
              </label>
              <textarea
                className="form-input"
                rows={8}
                value={testimonials}
                onChange={(e) => setTestimonials(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
