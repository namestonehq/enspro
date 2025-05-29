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
  status: "",
  header: "",
};

const emptyCoinTypes: Record<string, string> = {
  "0": "",
  "501": "",
  "2147483658": "", // Optimism
  "2147483785": "", // Polygon
  "2147525809": "", // Base
  "2147492101": "", // Arbitrum
};

export default function DomainModal({
  basename,
  trigger,
}: {
  basename: string;
  trigger: React.ReactNode;
}) {
  const [address, setAddress] = useState("");
  const [textRecords, setTextRecords] = useState(emptyTextRecords);
  const [coinTypes, setCoinTypes] = useState(emptyCoinTypes);
  const [l2Addresses, setL2Addresses] = useState(false); // checks op only
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
          setCoinTypes(data.coin_types);
          setL2Addresses(!!data.coin_types?.["2147483658"] || false); //checks op only
        });
      } else {
        console.error("Failed to fetch domain info");
      }
    });
  }, [basename]);

  function saveDomainInfo() {
    let coinTypesFull = {
      ...coinTypes,
      "2147483658": "",
      "2147483785": "",
      "2147525809": "",
      "2147492101": "",
    } as Record<string, string>;
    if (l2Addresses) {
      coinTypesFull = {
        ...coinTypes,
        "2147483658": address,
        "2147483785": address,
        "2147525809": address,
        "2147492101": address,
      };
    }
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
        coin_types: coinTypesFull,
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
  // update coinTypes using state
  function updateCoinTypes(key: string, value: string) {
    setCoinTypes((prev) => {
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
                <div
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
                </div>
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
                  <Label htmlFor="header" className="text-right text-white">
                    Header
                  </Label>
                </div>
                <Input
                  id="header"
                  value={textRecords?.["header"] || ""}
                  onChange={(e) => updateTextRecords("header", e.target.value)}
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
                  placeholder="I'm a web3 developer"
                />
                <div className="mb-2">
                  <Label htmlFor="status" className="text-right text-white">
                    Status
                  </Label>
                </div>
                <Input
                  id="status"
                  value={textRecords?.status || ""}
                  onChange={(e) => updateTextRecords("status", e.target.value)}
                  className=" bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded  mb-5"
                  placeholder="Heading to the moon"
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
            {editTab === "addresses" && (
              <div style={{ maxHeight: "380px", overflowY: "auto" }}>
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
                  {/* Optimism */}
                  <div className="mb-2">
                    <Label htmlFor="address" className="text-right text-white">
                      Optimism
                    </Label>
                  </div>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Image
                        src="/chains/icon-op.png"
                        alt="optimism"
                        width={18}
                        height={18}
                        className=""
                      />
                    </div>
                    <Input
                      id="optimism"
                      value={coinTypes?.["2147483658"] || ""}
                      onChange={(e) =>
                        updateCoinTypes("2147483658", e.target.value)
                      }
                      className="pl-[42px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                      placeholder="0x..."
                    />
                  </div>
                  {/* Polygon */}
                  <div className="mb-2">
                    <Label htmlFor="address" className="text-right text-white">
                      Polygon
                    </Label>
                  </div>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Image
                        src="/chains/icon-polygon.png"
                        alt="polygon"
                        width={18}
                        height={18}
                        className=""
                      />
                    </div>
                    <Input
                      id="polygon"
                      value={coinTypes?.["2147483785"] || ""}
                      onChange={(e) =>
                        updateCoinTypes("2147483785", e.target.value)
                      }
                      className="pl-[42px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                      placeholder="0x..."
                    />
                  </div>
                  {/* Base */}
                  <div className="mb-2">
                    <Label htmlFor="address" className="text-right text-white">
                      Base
                    </Label>
                  </div>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Image
                        src="/chains/icon-base.png"
                        alt="base"
                        width={18}
                        height={18}
                        className=""
                      />
                    </div>
                    <Input
                      id="base"
                      value={coinTypes?.["2147525809"] || ""}
                      onChange={(e) =>
                        updateCoinTypes("2147525809", e.target.value)
                      }
                      className="pl-[42px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                      placeholder="0x..."
                    />
                  </div>
                  {/* Arbitrum */}
                  <div className="mb-2">
                    <Label htmlFor="address" className="text-right text-white">
                      Arbitrum
                    </Label>
                  </div>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Image
                        src="/chains/icon-arb.png"
                        alt="arbitrum"
                        width={18}
                        height={18}
                        className=""
                      />
                    </div>
                    <Input
                      id="arbitrum"
                      value={coinTypes?.["2147492101"] || ""}
                      onChange={(e) =>
                        updateCoinTypes("2147492101", e.target.value)
                      }
                      className="pl-[42px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                      placeholder="0x..."
                    />
                  </div>
                </div>
                <hr className=" border-neutral-750" />
              </div>
            )}
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
