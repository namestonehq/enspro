import sql from "../../lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

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

  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const params = new URLSearchParams(req.url?.split("?")[1]);
  const address = token?.sub as string;
  const domain = params.get("domain");
  const name = "enspro";
  const email = "hello@enspro.xyz";

  let data;
  // check if we already have an api key
  const apiKeyQuery = await sql`
    select api_key from "ApiKey" where
    address = ${address} and domain = ${domain}
    order by "createdAt" desc
  `;
  if (apiKeyQuery.length !== 0) {
    return res.status(200).json({ message: "APIkey Exists" });
  }

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
    return res.status(200).json({ message: "APIkey added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch names" });
  }
}
