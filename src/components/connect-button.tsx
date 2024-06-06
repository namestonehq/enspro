"use client";

import { useEffect, useRef } from "react";
import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import { Button } from "./ui/button";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { Address } from "viem";

export const ConnectButton = () => {
  const { isConnecting, address, isConnected, chain } = useAccount();

  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();
  const { disconnect } = useDisconnect();

  const ens = useEnsName({
    address,
  });

  const buttonWidth = "w-36";

  const { address: userAddress } = useAccount();

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

  return (
    <Button
      className={`${buttonWidth}`}
      onClick={async () => {
        openAccountModal?.();
      }}
    >
      {" "}
      {ens && ens.data ? ens.data : showAddress(userAddress)}
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
