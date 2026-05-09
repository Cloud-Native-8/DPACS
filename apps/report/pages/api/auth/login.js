import { ApiError } from "../../../src/server/access-api-service.js";
import { loginEmployee } from "../../../src/server/auth-service.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed."
    });
  }

  try {
    const data = await loginEmployee(req.body ?? {});

    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.status).json({
        code: error.code,
        message: error.message
      });
    }

    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message
    });
  }
}
