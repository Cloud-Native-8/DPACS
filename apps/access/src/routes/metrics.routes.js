import { Router } from "express";
import { register } from "../observability/metrics.js";

const router = Router();

router.get("/metrics", async (_req, res, next) => {
  try {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
});

export default router;
