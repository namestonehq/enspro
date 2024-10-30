import sql from "../../lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

async function enableDomain(
  domain: string,
  address: string,
  companyName: string,
  email: string,
  signature: string
) {
  const response = await fetch(
    "https://namestone.xyz/api/public_v1/enable-domain",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_name: companyName,
        email: email,
        domain: domain,
        address: address,
        signature: signature,
      }),
    }
  );

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: "Unknown error occurred" };
    }
    throw new Error(
      `Failed to enable domain: ${errorData.error || response.statusText}`
    );
  }

  // Parse JSON once and store it
  const data = await response.json();

  try {
    // Insert into database only once with parsed data
    await sql`
      insert into "ApiKey" (
       domain, api_key, address
      ) values (
        ${domain}, ${data.api_key}, ${address}
      )`;
    console.log("API Key:", data.api_key);
    console.log("APIkey added to the database");
  } catch (error) {
    console.error("Database error:", error);
  }

  return data;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const { domain, signature } = req.body;
  const address = token.sub as string;
  const companyName = "enspro";
  const email = "alex+enspro@namestone.xyz";

  if (!domain || !signature) {
    return res.status(400).json({ error: "Domain and signature are required" });
  }

  // Check if we already have an API key
  const apiKeyQuery = await sql`
      select api_key from "ApiKey" where
      address = ${address} and domain = ${domain}
      order by "createdAt" desc
    `;
  if (apiKeyQuery.length !== 0) {
    return res.status(200).json({ message: "API key Exists" });
  }

  try {
    // Enable the domain with the signed message
    console.log("Enabling domain...");
    const data = await enableDomain(
      domain,
      address,
      companyName,
      email,
      signature
    );
    console.log(data);

    return res.status(200).json({ message: "API key added" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
