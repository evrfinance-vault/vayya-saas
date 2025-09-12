import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  logLevel: process.env.LOG_LEVEL || "info",
};
