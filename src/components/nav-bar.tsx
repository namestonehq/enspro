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
      <div className="cursor-pointer ">
        <Link href="/" className="flex items-center ">
          <Image
            className="mr-2"
            src="/enspro-icon.svg"
            alt="Logo"
            width={24}
            height={24}
          />
          <span className="text-white text-lg">
            ENS<span className=" text-emerald-500">Pro</span> |{" "}
            <span className=" text-neutral-400">
              Personal Subname Management
            </span>
          </span>
        </Link>
      </div>
      {/* Connect Button */}
      <ConnectButton />
    </div>
  );
}
