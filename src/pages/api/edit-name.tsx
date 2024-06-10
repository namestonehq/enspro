// pages/api/namestone-set-name.ts
import { NextApiRequest, NextApiResponse } from "next";
import sql from "../../lib/db";
import { getToken } from "next-auth/jwt";

async function makeRequest(url: string, apiKey: string, body: any) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const { method, ...body } = req.body;
  const address = token.sub as string;

  // get api key from database
  const apiKeyQuery = await sql`
    select api_key from "ApiKey" where
    address = ${address} and domain = ${body.domain}
  `;
  console.log("API Key Query:", apiKeyQuery);
  const apiKey = apiKeyQuery[0]?.api_key;

  if (!apiKey) {
    res.status(400).json({ error: "API key not found" });
    return;
  }

  try {
    if (method === "delete") {
      const data = await makeRequest(
        "https://namestone.xyz/api/public_v1/revoke-name",
        apiKey,
        body
      );
      res.status(200).json(data);
    } else if (method === "set") {
      const data = await makeRequest(
        "https://namestone.xyz/api/public_v1/set-name",
        apiKey,
        body
      );
      res.status(200).json(data);
    } else if (method === "edit") {
      // Creates the new name with relevant data
      await makeRequest(
        "https://namestone.xyz/api/public_v1/set-name",
        apiKey,
        body
      );

      // Deletes the old name
      await makeRequest(
        "https://namestone.xyz/api/public_v1/revoke-name",
        apiKey,
        {
          domain: body.domain,
          name: body.originalName,
          address: address,
        }
      );

      res.status(200).json({ message: "Name edited successfully" });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
}
