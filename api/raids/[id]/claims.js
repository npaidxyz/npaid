import { handleVercel, keepQuery } from "../../../server/vercelApi.js";

export default function handler(req, res) {
  const id = encodeURIComponent(String(req.query?.id || ""));
  keepQuery(req, `/api/raids/${id}/claims`);
  return handleVercel(req, res, "raids");
}
