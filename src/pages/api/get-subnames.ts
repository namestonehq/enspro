// pages/api/get-subnames.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getSubnames, Name } from "@ensdomains/ensjs/subgraph";
import { addEnsContracts } from "@ensdomains/ensjs";
import { mainnet } from "viem/chains";
import { createPublicClient, http } from "viem";

const client = createPublicClient({
  chain: addEnsContracts(mainnet),
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

  const params = new URLSearchParams(req.url?.split("?")[1]);
  const name = params.get("name");
  const apiKey = process.env.API_KEY || "default_api_key";

  try {
    const [onchainSubnames, offchainSubnames] = await Promise.all([
      getSubnames(client, { name: name as string }),
      fetchOffchainSubnames(name as string, apiKey),
    ]);

    const combinedSubnames = onchainSubnames.map((item: Name) => ({
      ...item,
      nameType: "onchain",
    }));

    if (Array.isArray(offchainSubnames) && offchainSubnames.length > 0) {
      combinedSubnames.push(
        ...offchainSubnames.map((item: any) => ({
          ...item,
          name: item.name + "." + item.domain,
          nameType: "offchain",
          resolvedAddress: item.address,
          labelName: item.name,
        }))
      );
    }

    res.status(200).json(combinedSubnames);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch subnames" });
  }
}

async function fetchOffchainSubnames(domain: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://namestone.xyz/api/public_v1/get-names?domain=${domain}`,
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
      return data;
    } else {
      console.log("Response Status:", response.status);

      if (response.status === 400) {
        console.log("Received a 400 error, returning empty object.");
        return {};
      } else {
        throw new Error(
          `Failed to fetch off-chain subnames: Status ${response.status}`
        );
      }
    }
  } catch (error) {
    console.error("Error fetching off-chain subnames:", error);
    throw error;
  }
}
