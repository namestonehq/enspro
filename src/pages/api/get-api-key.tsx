import sql from "../../lib/db";
import { NextApiRequest, NextApiResponse } from "next";

async function makeRequest(url: string, body: any) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const params = new URLSearchParams(req.url?.split("?")[1]);
  const address = params.get("address");
  const domain = params.get("domain");
  const name = "ensone";
  const email = "hello@ensone.xyz";

  let data;
  // get api key from namestone
  try {
    data = await makeRequest(
      "https://namestone.xyz/api/public_v1/create-api-key",

      {
        domain: domain,
        wallet: address,
        name: name,
        email: email,
      }
    );
    console.log(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create api key" });
  }
  // add to database
  try {
    // insert
    await sql`
      insert into "ApiKey" (
       domain, api_key, address
      ) values (
        ${domain}, ${data.api_key}, ${address}
      )`;
    return res.status(200).json({ message: "Name added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch names" });
  }
}
