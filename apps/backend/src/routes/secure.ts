import type { Request, Response } from "express";

export async function ping(req: Request, res: Response) {
  const now = new Date().toISOString();
  res.json({ ok: true, at: now });
}
