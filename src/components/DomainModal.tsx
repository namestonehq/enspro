"use client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ReactNode } from "react";
import { useEffect, useState } from "react";
import { isAddress } from "viem";

import Image from "next/image";
import Link from "next/link";
import _ from "lodash";
import toast, { Toaster } from "react-hot-toast";
import AddressCheck from "./AddressCheck";

const emptyTextRecords = {
  avatar: "",
  description: "",
  location: "",
  "com.twitter": "",
  "com.github": "",
  "com.discord": "",
  "org.telegram": "",
  email: "",
  url: "",
};

// const emptyCoinTypes = {
//   "0": "",
//   "501": "",
//   "2147483658": "",
// };

export default function DomainModal({
  basename,
  trigger,
}: {
  basename: string;
  trigger: React.ReactNode;
}) {
  const [address, setAddress] = useState("");
  const [textRecords, setTextRecords] = useState(emptyTextRecords);
  const [contenthash, setContenthash] = useState("");
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editTab, setEditTab] = useState("subname"); //subname, profile, links, addresses

  // useEffect to get domainInfo
  useEffect(() => {
    fetch(`/api/get-domain?domain=${basename}`).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          console.log("Domain Info:", data);
          setAddress(data.address || "");
          setTextRecords(data.text_records);
          setContenthash(data.contenthash);
        });
      } else {
        console.error("Failed to fetch domain info");
      }
    });
  }, [basename]);

  function saveDomainInfo() {
    // Save domainInfo
    fetch(`/api/edit-domain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: basename,
        address: address,
        text_records: textRecords,
        contenthash: contenthash,
      }),
    }).then((response) => {
      setOpen(false);
      if (response.ok) {
        console.log("Domain info saved successfully");
        toast.success("Domain info saved successfully");
      } else {
        console.error("Failed to save domain info");
        toast.error("Failed to save domain info");
      }
    }); // Handle any network or other errors
  }

  // update textRecords using state
  function updateTextRecords(key: string, value: string) {
    setTextRecords((prev) => {
      return { ...prev, [key]: value };
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]  bg-neutral-800"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {editTab === "subname" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex text-white">Edit Domain</DialogTitle>
            </DialogHeader>
            <div className="">
              <div className="mb-2 text-right">
                <span
                  onMouseDown={() => setEditTab("profile")}
                  className=" text-neutral-300 text-sm  cursor-pointer hover:text-emerald-400"
                >
                  More Records &rsaquo;
                </span>
              </div>
            </div>
            <div className="">
              <div className="mb-2">
                <Label htmlFor="address" className="text-right text-white">
                  Address
                </Label>
              </div>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className=" bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded text-wrap"
                disabled={false}
                placeholder="0x123..."
              />
              <AddressCheck address={address} />
            </div>
          </>
        ) : (
          <>
            <div className="">
              <div className="mb- mt-2 ">
                <span
                  onMouseDown={() => setEditTab("subname")}
                  className="text-neutral-300 text-sm  cursor-pointer hover:text-emerald-400"
                >
                  &lsaquo; {basename}
                </span>
              </div>
              <div className="justify-start items-center gap-5 inline-flex mb-4 mt-4">
                <div
                  onMouseDown={() => setEditTab("profile")}
                  className={`${
                    editTab === "profile"
                      ? " border-emerald-400"
                      : "border-neutral-500"
                  } px-1 pb-3 border-b-2 justify-center items-center gap-2 flex cursor-pointer`}
                >
                  <div className="justify-start items-center gap-1 flex">
                    <div
                      className={`${
                        editTab === "profile"
                          ? "text-emerald-400"
                          : "text-neutral-300"
                      } text-sm`}
                    >
                      Profile
                    </div>
                  </div>
                </div>
                <div
                  className={`${
                    editTab === "links"
                      ? " border-emerald-400"
                      : "border-neutral-500"
                  } px-1 pb-3 border-b-2 justify-center items-center gap-2 flex cursor-pointer`}
                  onMouseDown={() => setEditTab("links")}
                >
                  <div className="justify-start items-center gap-1 flex">
                    <div
                      className={`${
                        editTab === "links"
                          ? "text-emerald-400"
                          : "text-neutral-300"
                      } text-sm`}
                    >
                      Links
                    </div>
                  </div>
                </div>
                {/* <div
                  onMouseDown={() => setEditTab("addresses")}
                  className={`${
                    editTab === "addresses"
                      ? " border-emerald-400"
                      : "border-neutral-500"
                  } px-1 pb-3 border-b-2 justify-center items-center gap-2 flex cursor-pointer`}
                >
                  <div className="justify-start items-center gap-1 flex">
                    <div
                      className={`${
                        editTab === "addresses"
                          ? "text-emerald-400"
                          : "text-neutral-300"
                      } text-sm`}
                    >
                      Addresses
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
            {editTab === "profile" && (
              <div className="">
                <div className="mb-2">
                  <Label htmlFor="avatar" className="text-right text-white">
                    Avatar
                  </Label>
                </div>
                <Input
                  id="avatar"
                  value={textRecords?.["avatar"] || ""}
                  onChange={(e) => updateTextRecords("avatar", e.target.value)}
                  className=" bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded mb-5"
                  placeholder="URL (https://)"
                />
                <div className="mb-2">
                  <Label
                    htmlFor="description"
                    className="text-right text-white"
                  >
                    Description
                  </Label>
                </div>
                <Input
                  id="description"
                  value={textRecords?.description || ""}
                  onChange={(e) =>
                    updateTextRecords("description", e.target.value)
                  }
                  className=" bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded  mb-5"
                  placeholder="I’m a web3 developer"
                />
                <div className="mb-2">
                  <Label htmlFor="location" className="text-right text-white">
                    Location
                  </Label>
                </div>
                <Input
                  id="location"
                  value={textRecords?.location || ""}
                  onChange={(e) =>
                    updateTextRecords("location", e.target.value)
                  }
                  className=" bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded  mb-5"
                  placeholder="NYC"
                />
              </div>
            )}
            {editTab === "links" && (
              <div>
                <div className="text-white mb-2">Links</div>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Image
                      src="icon-link.svg"
                      alt="url"
                      width={12}
                      height={12}
                      className=""
                    />
                  </div>
                  <Input
                    id="url"
                    value={textRecords?.url || ""}
                    onChange={(e) => updateTextRecords("url", e.target.value)}
                    className="pl-[36px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                    placeholder="https://namestone.xyz/"
                  />
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Image
                      src="icon-x.svg"
                      alt="x / twitter"
                      width={12}
                      height={12}
                      className=""
                    />
                  </div>
                  <Input
                    id="twitter"
                    value={textRecords?.["com.twitter"] || ""}
                    onChange={(e) =>
                      updateTextRecords("com.twitter", e.target.value)
                    }
                    className="pl-[36px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                    placeholder="AlexSlobodnik"
                  />
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Image
                      src="icon-github.svg"
                      alt="github"
                      width={12}
                      height={12}
                      className=""
                    />
                  </div>
                  <Input
                    id="github"
                    value={textRecords?.["com.github"] || ""}
                    onChange={(e) =>
                      updateTextRecords("com.github", e.target.value)
                    }
                    className="pl-[36px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                    placeholder="aslobodnik"
                  />
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Image
                      src="icon-discord.svg"
                      alt="discord"
                      width={12}
                      height={12}
                      className=""
                    />
                  </div>
                  <Input
                    id="discord"
                    value={textRecords?.["com.discord"] || ""}
                    onChange={(e) =>
                      updateTextRecords("com.discord", e.target.value)
                    }
                    className="pl-[36px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                    placeholder="aslobodnik"
                  />
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Image
                      src="icon-telegram.svg"
                      alt="telegram"
                      width={12}
                      height={12}
                      className=""
                    />
                  </div>
                  <Input
                    id="telegram"
                    value={textRecords?.["org.telegram"] || ""}
                    onChange={(e) =>
                      updateTextRecords("org.telegram", e.target.value)
                    }
                    className="pl-[36px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                    placeholder="Telegram"
                  />
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Image
                      src="icon-email.svg"
                      alt="email"
                      width={12}
                      height={12}
                      className=""
                    />
                  </div>
                  <Input
                    id="email"
                    value={textRecords?.["email"] || ""}
                    onChange={(e) => updateTextRecords("email", e.target.value)}
                    className="pl-[36px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                    placeholder="Email"
                  />
                </div>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Image
                      src="icon-contenthash.svg"
                      alt="contenthash"
                      width={12}
                      height={12}
                      className=""
                    />
                  </div>
                  <Input
                    id="contenthash"
                    value={contenthash || ""}
                    onChange={(e) => setContenthash(e.target.value)}
                    className="pl-[36px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                    placeholder="ipfs://"
                  />
                </div>
              </div>
            )}
            {/* {editTab === "addresses" && (
              <>
                <div className="">
                  <div className="mb-2">
                    <Label htmlFor="address" className="text-right text-white">
                      Bitcoin
                    </Label>
                  </div>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Image
                        src="/chains/icon-bitcoin.png"
                        alt="bitcoin"
                        width={18}
                        height={18}
                        className=""
                      />
                    </div>
                    <Input
                      id="bitcoin"
                      value={coinTypes?.["0"] || ""}
                      onChange={(e) => updateCoinTypes("0", e.target.value)}
                      className="pl-[42px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                      placeholder="bc1"
                    />
                  </div>
                  <div className="mb-2">
                    <Label htmlFor="address" className="text-right text-white">
                      Solana
                    </Label>
                  </div>
                  <div className="relative  mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Image
                        src="/chains/icon-solana.png"
                        alt="solana"
                        width={18}
                        height={18}
                        className=""
                      />
                    </div>
                    <Input
                      id="solana"
                      value={coinTypes?.["501"] || ""}
                      onChange={(e) => updateCoinTypes("501", e.target.value)}
                      className="pl-[42px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                      placeholder="solana"
                    />
                  </div>
                </div>
                <hr className=" border-neutral-750" />

                <div className="justify-between items-center flex">
                  <div className="flex-col justify-center items-start gap-2 inline-flex">
                    <div className="text-white text-sm font-bold ">
                      Add L2 Address Support
                    </div>
                    <div className="text-neutral-300 text-sm font-medium">
                      Add and match ETH address
                    </div>
                    <div className="justify-start items-center gap-3 inline-flex">
                      <Image
                        src="/chains/icon-op.png"
                        alt="op"
                        width={18}
                        height={18}
                        className=""
                      />
                      <Image
                        src="/chains/icon-polygon.png"
                        alt="op"
                        width={18}
                        height={18}
                        className=""
                      />
                      <Image
                        src="/chains/icon-arb.png"
                        alt="op"
                        width={18}
                        height={18}
                        className=""
                      />
                      <Image
                        src="/chains/icon-base.png"
                        alt="op"
                        width={18}
                        height={18}
                        className=""
                      />
                    </div>
                  </div>
                  <div
                    className={`${
                      l2Addresses
                        ? "bg-emerald-600 justify-end"
                        : "bg-neutral-600 justify-start"
                    } h-6 p-1 w-[44px] rounded-[999px] justify-start items-center gap-2.5 flex`}
                    onMouseDown={() => setL2Addresses(!l2Addresses)}
                  >
                    <div className="w-4 h-4 bg-neutral-300 rounded-full" />
                  </div>
                </div>
                <div className="h-[33px] px-3 py-[9px] bg-[#333333] rounded-md justify-start items-center gap-3 flex my-4">
                  <div className="text-neutral-400 text-xs font-medium ">
                    {address}
                  </div>
                </div>
              </>
            )} */}
          </>
        )}

        <DialogFooter>
          <div className="flex w-full justify-between flex-row-reverse">
            <Button
              className="w-24 float-right"
              disabled={false}
              onMouseDown={() => {
                saveDomainInfo();
              }}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
