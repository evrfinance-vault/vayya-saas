import express, { json } from "express";
import morgan from "morgan";
import cors from "cors";
import { config } from "./config.js";
import { healthHandler } from "./routes/health.js";
import { requireAuth } from "./auth.js";
import { ping } from "./routes/secure.js";
import { ownerOverview } from "./routes/ownerOverview";

const app = express();
app.use(cors());
app.use(json());
app.use(morgan("dev"));

app.get("/health", healthHandler);
app.get("/", (_req, res) => res.send("Back-end is alive and healthy."));

// protect all API routes
app.use("/api", requireAuth);
app.get("/api/ping", ping);

app.use(ownerOverview);

app.listen(config.port, () => {
  console.log(`[Back-end] Listening on http://localhost:${config.port}`);
});
