import { NameWithRelation } from "@ensdomains/ensjs/subgraph";
import { addEnsContracts, ensSubgraphActions } from "@ensdomains/ensjs";
import { batch, getResolver } from "@ensdomains/ensjs/public";
import { mainnet } from "viem/chains";
import { createPublicClient, http, isAddress } from "viem";
import { NextApiRequest, NextApiResponse } from "next";

const client = createPublicClient({
  chain: addEnsContracts(mainnet),
  transport: http(),
}).extend(ensSubgraphActions);

const goodResolvers = [
  "0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD",
  "0xd17347fA0a6eeC89a226c96a9ae354F785e94241",
  "0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65",
];

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

  if (!address || !isAddress(address)) {
    res.status(400).json({ error: "Missing address" });
    return;
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  try {
    const result = await client.getNamesForAddress({ address });

    const filteredResult: NameWithRelation[] = result.filter(
      (item: NameWithRelation) => item.name
    );

    const displayedData = await batch(
      client,
      ...filteredResult.map((item) =>
        getResolver.batch({ name: item.name as string })
      )
    );

    const enrichedData = filteredResult.map((item, index) => ({
      name: item.name,
      resolvedAddress: item.resolvedAddress,
      parentName: item.parentName,
      owner: item.owner,
      createdAt: item.createdAt,
      status: goodResolvers.includes(displayedData[index] || ""),
      expiryDate: item.expiryDate,
      resolver: displayedData[index],
    }));

    res.status(200).json(enrichedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch names" });
  }
}
