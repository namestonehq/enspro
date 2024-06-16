"use client";

import { useEffect, useRef } from "react";
import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import { Button } from "./ui/button";
import { useAccount, useEnsName, useDisconnect } from "wagmi";
import { Address } from "viem";
import { useSession } from "next-auth/react";

export const ConnectButton = () => {
  const { isConnecting, address, isConnected, chain } = useAccount();
  const { data: session } = useSession();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();
  const ens = useEnsName({
    address,
  });

  const buttonWidth = "w-36";
  console.log("SESSION", session?.address, address, isConnected, chain);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  if (!isConnected) {
    return (
      <Button
        className={`${buttonWidth}`}
        onClick={openConnectModal}
        disabled={isConnecting}
      >
        {isConnecting ? "Connecting..." : "Connect"}
      </Button>
    );
  }

  if (isConnected && !chain) {
    return (
      <Button className={`${buttonWidth}`} onClick={openChainModal}>
        Wrong network
      </Button>
    );
  }
  if (!session || session.address !== address)
    return (
      <Button
        className={`${buttonWidth}`}
        onClick={async () => {
          if (!openConnectModal) {
            disconnect?.();
          } else {
            openConnectModal?.();
          }
        }}
      >
        Sign In
      </Button>
    );

  return (
    <Button
      className={`${buttonWidth}`}
      onClick={async () => {
        openAccountModal?.();
      }}
    >
      {" "}
      {ens && ens.data ? ens.data : showAddress(address)}
    </Button>
  );
};

function showAddress(address: Address | undefined) {
  if (!address) return "Connect";
  else
    return `${address.toLowerCase().slice(0, 6)}...${address
      .toLowerCase()
      .slice(-4)}`;
}
