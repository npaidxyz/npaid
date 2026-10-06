import { handleVercel, keepQuery } from "../../server/vercelApi.js";

export default function handler(req, res) {
  keepQuery(req, "/api/x/me");
  return handleVercel(req, res, "x");
}
