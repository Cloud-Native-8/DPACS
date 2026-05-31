import cors from "cors";
import express from "express";
import accessRoutes from "./routes/access.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";

const app = express();
const defaultCorsOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
const configuredCorsOrigins =
  process.env.ACCESS_CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? defaultCorsOrigins;

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "access" });
});

app.get("/readyz", (_req, res) => {
  res.json({ ready: true, service: "access" });
});

app.use(metricsRoutes);
app.use(accessRoutes);

app.use((error, _req, res, _next) => {
  res.status(error.statusCode || 500).json({
    error: error.message || "Unexpected error",
  });
});

export default app;
