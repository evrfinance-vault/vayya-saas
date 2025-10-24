import { Router } from "express";
import { prisma } from "../db/prisma";

export const settingsRouter = Router();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET!;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || `https://${AUTH0_DOMAIN}/api/v2/`;

async function getManagementToken(): Promise<string> {
  const resp = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: AUTH0_AUDIENCE,
    }),
  });
  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(`Auth0 token error: ${msg}`);
  }
  const json: any = await resp.json();
  return json.access_token as string;
}

settingsRouter.get("/api/settings/account", async (req, res) => {
  const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const token = await getManagementToken();
    const resp = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return res.status(resp.status).json({ error: await resp.text() });
    const u: any = await resp.json();
    res.json({ userId, name: u.name ?? "", email: u.email ?? "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

settingsRouter.post("/api/settings/account", async (req, res) => {
  const { userId, name, email } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const token = await getManagementToken();
    const resp = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name, email }),
    });
    if (!resp.ok) return res.status(resp.status).json({ error: await resp.text() });
    const u: any = await resp.json();
    res.json({ ok: true, userId, name: u.name, email: u.email });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

settingsRouter.get("/api/settings/discovery-profile", async (_req, res) => {
  const row = await prisma.businessProfile.findFirst({ where: { id: 1 } });
  res.json(row ?? null);
});

settingsRouter.put("/api/settings/discovery-profile", async (req, res) => {
  const {
    name,
    address,
    hours,
    website,
    services,
    financingOptions,
    testimonials,
  } = req.body || {};

  const row = await prisma.businessProfile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: name ?? null,
      address: address ?? null,
      hours: hours ?? null,
      website: website ?? null,
      services: services ?? [],
      financingOptions: financingOptions ?? [],
      testimonials: testimonials ?? [],
    },
    update: {
      name: name ?? null,
      address: address ?? null,
      hours: hours ?? null,
      website: website ?? null,
      services: services ?? [],
      financingOptions: financingOptions ?? [],
      testimonials: testimonials ?? [],
    },
  });

  res.json(row);
});
