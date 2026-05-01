import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateAccessRequest } from "../services/access-decision.service.js";

const router = Router();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const checkPagePath = path.resolve(currentDirectoryPath, "../views/check.html");

router.get("/check", (_req, res) => {
  res.sendFile(checkPagePath);
});

router.post("/check", async (req, res, next) => {
  try {
    const result = await evaluateAccessRequest(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.log({ error });
    error.statusCode = error.statusCode || 400;
    next(error);
  }
});

export default router;
