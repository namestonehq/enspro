"use client";
import Link from "next/link";
import { ConnectButton } from "./connect-button";
import Image from "next/image";

export default function NavBar() {
  return (
    <div className="flex w-full z-20 py-4 px-8 justify-between items-center">
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
            ENS<span className=" text-emerald-500">Pro</span>
            <span className=" hidden sm:inline text-neutral-400">
              <span className="text-white ml-1">|</span> Personal Subname
              Management
            </span>
          </span>
        </Link>
      </div>
      {/* Connect Button */}
      <ConnectButton />
    </div>
  );
}
