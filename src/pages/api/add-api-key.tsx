import sql from "../../lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const params = new URLSearchParams(req.url?.split("?")[1]);
  const address = sub.token as string;
  const domain = params.get("domain");
  const apiKey = params.get("api_key");

  try {
    // insert
    await sql`
      insert into "ApiKey" (
       domain, api_key, address
      ) values (
        ${domain}, ${apiKey}, ${address}
      )`;
    return res.status(200).json({ message: "Name added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch names" });
  }
}
