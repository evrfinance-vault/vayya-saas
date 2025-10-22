import type { Request, Response } from "express";
import { Pool } from "pg";
import { config } from "../config.js";

const pool = new Pool({ connectionString: config.databaseUrl });

export async function healthHandler(req: Request, res: Response) {
  try {
    let dbOk = false;
    try {
      const result = await pool.query("SELECT 1 as ok");
      dbOk = result?.rows?.[0]?.ok === 1;
    } catch {
      dbOk = false;
    }

    res.json({
      status: "ok",
      service: "backend",
      db: dbOk ? "reachable" : "unreachable",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
}
