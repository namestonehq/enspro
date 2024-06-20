// pages/api/get-subnames.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getSubnames, Name } from "@ensdomains/ensjs/subgraph";
import { addEnsContracts } from "@ensdomains/ensjs";
import { mainnet } from "viem/chains";
import { createPublicClient, http } from "viem";
import sql from "../../lib/db";
import { getToken } from "next-auth/jwt";

const client = createPublicClient({
  chain: {
    ...addEnsContracts(mainnet),
    subgraphs: {
      ens: {
        url: process.env.SUBGRAPH_URL || "",
      },
    },
  },
  transport: http(),
});

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
  const domain = params.get("domain");
  const address = token?.sub as string;
  console.log("Domain:", domain, "Address:", address);
  // get api key from database
  const apiKeyQuery = await sql`
    select api_key from "ApiKey" where
    address = ${address} and domain = ${domain}
    order by "createdAt" desc
  `;
  if (apiKeyQuery.length === 0) {
    console.log("API Key error");
    res.status(400).json({ error: "API key not found" });
    return;
  }
  const apiKey = apiKeyQuery[0].api_key;

  try {
    const response = await fetch(
      `https://namestone.xyz/api/public_v1/get-domain?domain=${domain}`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      console.log("Response Status:", response.status);

      if (response.status === 400) {
        console.log("Received a 400 error, returning empty object.");
        return {};
      } else {
        console.error("Error fetching off-chain domain:", response.status);
        res.status(500).json({ error: "Failed to off-chain domain" });
      }
    }
  } catch (error) {
    console.error("Error fetching off-chain domain:", error);
    res.status(500).json({ error: "Failed to off-chain domain" });
  }
}
