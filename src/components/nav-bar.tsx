"use client";
import Link from "next/link";
import { ConnectButton } from "./connect-button";
import Image from "next/image";
import { useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";

export default function NavBar() {
  const { isConnected } = useAccount();
  const { address } = useAccount();

  return (
    <div className="flex w-full z-20 py-4 justify-between items-center">
      {/* Logo */}
      <div className="cursor-pointer">
        <Link href="/" className="flex items-center">
          <Image
            className="mr-1"
            src="/bw-logo.svg"
            alt="Logo"
            width={16}
            height={16}
          />
          <span>ENS/ONE</span>
        </Link>
      </div>
      {/* Connect Button */}
      <ConnectButton />
    </div>
  );
}
