import { handleVercel, keepQuery } from "../server/vercelApi.js";

export default function handler(req, res) {
  keepQuery(req, "/api/raids");
  return handleVercel(req, res, "raids");
}
