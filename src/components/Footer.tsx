import { LightningBoltIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <div className=" bg-neutral-900 h-16 absolute items-center w-full z-10 flex">
      <div className="flex  items-center justify-center sm:w-[800px] mx-auto">
        <LightningBoltIcon className=" text-orange-400" />
        <span className="ml-1  text-neutral-300">
          Powered By{" "}
          <Link
            href="https://namestone.xyz"
            target="_blank"
            className=" hover:text-orange-400 transition-colors duration-300 ease-in text-neutral-300"
          >
            NameStone
          </Link>{" "}
          <span className="mr-2 text-neutral-300">|</span>
        </span>
        <Link href="https://twitter.com/namestonehq" target="_blank">
          <Image
            className="mr-1"
            src="/ant-design_x-outlined.svg"
            alt="Logo"
            width={16}
            height={16}
          />
        </Link>
      </div>
    </div>
  );
}
