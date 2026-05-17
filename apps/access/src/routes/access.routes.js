import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  accessCheckDurationSeconds,
  accessCheckTotal,
  getAccessCheckResultLabel,
} from "../observability/metrics.js";
import { evaluateAccessRequest } from "../services/access-decision.service.js";

const router = Router();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const checkPagePath = path.resolve(currentDirectoryPath, "../views/check.html");

router.get("/check", (_req, res) => {
  res.sendFile(checkPagePath);
});

router.post("/check", async (req, res, next) => {
  const endTimer = accessCheckDurationSeconds.startTimer();

  try {
    const result = await evaluateAccessRequest(req.body);
    const resultLabel = getAccessCheckResultLabel(result);

    accessCheckTotal.inc({ result: resultLabel });
    endTimer({ result: resultLabel });

    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 400;

    console.warn("access check failed", {
      name: error.name,
      message: error.message,
      statusCode,
    });

    accessCheckTotal.inc({ result: "error" });
    endTimer({ result: "error" });

    error.statusCode = statusCode;
    next(error);
  }
});

export default router;
