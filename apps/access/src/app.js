import cors from "cors";
import express from "express";
import accessRoutes from "./routes/access.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(accessRoutes);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "access" });
});

app.get("/readyz", (_req, res) => {
  res.json({ ready: true, service: "access" });
});

app.use((error, _req, res, _next) => {
  res.status(error.statusCode || 500).json({
    error: error.message || "Unexpected error"
  });
});

export default app;
