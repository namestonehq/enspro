"use client";

import { http, createStorage, cookieStorage } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Chain, getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

const supportedChains: Chain[] = [mainnet];

export const config = getDefaultConfig({
  appName: "EnsOne",
  projectId,
  chains: [mainnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: supportedChains.reduce(
    (obj, chain) => ({
      ...obj,
      [chain.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC || ""),
    }),
    {}
  ),
});
