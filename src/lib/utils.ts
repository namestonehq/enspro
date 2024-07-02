import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Address, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { addEnsContracts } from "@ensdomains/ensjs";
import { normalize } from "viem/ens";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const client = createPublicClient({
  batch: { multicall: true },
  chain: {
    ...addEnsContracts(mainnet),
    subgraphs: {
      ens: {
        url: process.env.SUBGRAPH_URL || "",
      },
    },
  },
  transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC || ""),
});

export async function getOnchainDomainInfo(basename: string) {
  console.log("Fetching domain for", basename);
  const address = await client.getEnsAddress({
    name: normalize(basename),
  });
  console.log("Address:", address);
  const description = await client.getEnsText({
    name: normalize(basename),
    key: "description",
  });
  const ensAvatar = await client.getEnsAvatar({
    name: normalize(basename),
  });
  const location = await client.getEnsText({
    name: normalize(basename),
    key: "location",
  });
  const twitter = await client.getEnsText({
    name: normalize(basename),
    key: "com.twitter",
  });
  const discord = await client.getEnsText({
    name: normalize(basename),
    key: "com.discord",
  });
  const github = await client.getEnsText({
    name: normalize(basename),
    key: "com.github",
  });
  const website = await client.getEnsText({
    name: normalize(basename),
    key: "url",
  });

  const result = {
    domain: basename,
    address: address as string,
    text_records: {
      avatar: ensAvatar as string,
      description: description as string,
      location: location as string,
      "com.twitter": twitter as string,
      "com.github": github as string,
      "com.discord": discord as string,
      url: website as string,
    },
  };
  return result;
}
