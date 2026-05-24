import { ApiError } from "../../../src/server/api-error.js";
import { getCurrentEmployee } from "../../../src/server/auth-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed."
    });
  }

  try {
    const employee = await getCurrentEmployee(req);

    return res.status(200).json({
      employee
    });
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
