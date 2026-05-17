import { ApiError, handleAccessApiRequest } from "../../src/server/access-api-service.js";
import { requireAuth } from "../../src/server/jwt-auth.js";

export default async function handler(req, res) {
  try {
    const currentUser = requireAuth(req);
    const data = await handleAccessApiRequest({
      method: req.method,
      path: req.query.path ?? [],
      query: req.query,
      body: req.body,
      currentUser
    });

    if (data === null) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Resource not found."
      });
    }

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
