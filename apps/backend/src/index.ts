import express, { json } from "express";
import morgan from "morgan";
import cors from "cors";
import { config } from "./config.js";
import { healthHandler } from "./routes/health.js";
import { requireAuth } from "./auth.js";
import { ping } from "./routes/secure.js";
import { ownerOverview } from "./routes/ownerOverview";
import { settingsRouter } from "./routes/settings";

const app = express();
app.use(cors());
app.use(json());
app.use(morgan("dev"));

app.get("/health", healthHandler);
app.get("/", (_req, res) => res.send("Back-end is alive and healthy."));

app.use("/api", requireAuth);
app.get("/api/ping", ping);

app.use(ownerOverview);
app.use(settingsRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Auth error:", err.name, err.message);
  res.status(err.status || 401).send(err.message || "Unauthorized");
});

app.listen(config.port, () => {
  console.log(`[Back-end] Listening on http://localhost:${config.port}`);
});
