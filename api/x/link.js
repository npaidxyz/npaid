import { handleVercel, keepQuery } from "../../server/vercelApi.js";

export default function handler(req, res) {
  keepQuery(req, "/api/x/link");
  return handleVercel(req, res, "x");
}
