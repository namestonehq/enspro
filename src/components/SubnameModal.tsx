"use client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ReactNode } from "react";
import { Address, createPublicClient, http } from "viem";
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

const emptyCoinTypes = {
  "0": "",
  "501": "",
  "2147483658": "",
};

export default function SubnameModal({
  name,
  basename,
  refetchSubnames,
  children,
  existingSubnames,
  modalType,
}: {
  name?: Subname;
  basename: string;
  refetchSubnames: () => void;
  children: ReactNode;
  existingSubnames: Subname[];
  modalType: string;
}) {
  const [subname, setSubname] = useState(name?.labelName || "");
  const [address, setAddress] = useState(name?.resolvedAddress || "");
  const [textRecords, setTextRecords] = useState(
    name?.text_records || emptyTextRecords
  );
  const [coinTypes, setCoinTypes] = useState(
    name?.coin_types || emptyCoinTypes
  );
  const [contenthash, setContenthash] = useState(name?.contenthash || "");
  const [l2Addresses, setL2Addresses] = useState(
    !!name?.coin_types?.["2147483658"] || false
  ); // checks op only
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editTab, setEditTab] = useState("subname"); //subname, profile, links, addresses
  const [subnameError, setSubnameError] = useState("");

  const nameType = name?.nameType || "offchain";

  useEffect(() => {
    setSubname(name?.labelName || "");
    setAddress(name?.resolvedAddress || "");
    setTextRecords(name?.text_records || emptyTextRecords);
    setCoinTypes(name?.coin_types || emptyCoinTypes);
    setL2Addresses(!!name?.coin_types?.["2147483658"] || false);
    setContenthash(name?.contenthash || "");
  }, [name]);

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

  // use Effect to check if the subname already exists
  useEffect(() => {
    if (
      existingSubnames.find(
        (existinName) =>
          existinName.labelName === subname &&
          existinName.labelName !== name?.labelName
      )
    ) {
      setSubnameError("Subname already exists");
    } else {
      setSubnameError("");
    }
  }, [subname, existingSubnames]);

  async function changeSubname(method: string) {
    const originalName = name?.labelName || ""; // The original subname
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
    const body = {
      domain: basename,
      name: subname,
      address: address,
      method: method,
      originalName: originalName,
      coin_types: coinTypesFull,
      text_records: textRecords,
      contenthash: contenthash,
    };

    if (fetching) return;
    setFetching(true);
    try {
      const response = await fetch(`/api/edit-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      console.log({ body, response });
      if (response.ok) {
        const data = await response.json();
        console.log(`Subname method ${method} executed successfully:`, data);
        toast.success(`Subname ${method} successful`);
      } else {
        console.error(`Failed to execute ${method} for subname`);
        toast.error(`Failed to ${method} subname`);
      }
      setFetching(false);
    } catch (error) {
      console.error(`Network Error method:${method}`, error);
      toast.error(`Network Error: Failed to ${method} subname`);
    }
    refetchSubnames();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]  bg-neutral-800"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {editTab === "subname" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex text-white">
                {nameType === "onchain"
                  ? "View"
                  : modalType === "edit"
                  ? "Edit"
                  : "Add"}{" "}
                Subname
              </DialogTitle>
            </DialogHeader>
            <div className="">
              {nameType === "offchain" && (
                <div className="mb-2 text-right">
                  <span
                    onMouseDown={() => setEditTab("profile")}
                    className=" text-neutral-300 text-sm  cursor-pointer hover:text-emerald-400"
                  >
                    More Records &rsaquo;
                  </span>
                </div>
              )}
              <div className="mb-2">
                <Label htmlFor="subname" className="text-right text-white">
                  Subname
                </Label>
              </div>
              <SubnameInput
                error={subnameError}
                setSubname={setSubname}
                subname={subname}
                basename={basename}
                nameType={nameType}
              />
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
                disabled={nameType === "onchain"}
                placeholder="0x123..."
              />
              <AddressCheck address={address} />
            </div>
          </>
        ) : (
          <>
            <div className="">
              <div className="mb-2 mt-2 ">
                <span
                  onMouseDown={() => setEditTab("subname")}
                  className="text-neutral-300 text-sm  cursor-pointer hover:text-emerald-400"
                >
                  &lsaquo; {subname}.{basename}
                </span>
              </div>
              <div className="justify-start items-center gap-5 inline-flex">
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
              <>
                <Label className=" text-white">Links</Label>
                <div className="relative">
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
                <div className="relative">
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
                <div className="relative">
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
                <div className="relative">
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
                <div className="relative">
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
                <div className="relative">
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
                <div className="relative">
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
              </>
            )}
            {editTab === "addresses" && (
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
                <div className="h-[33px] px-3 py-[9px] bg-[#333333] rounded-md justify-start items-center gap-3 inline-flex">
                  <div className="text-neutral-400 text-xs font-medium ">
                    {address}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <DialogFooter>
          {nameType === "offchain" ? (
            <div className="flex w-full justify-between flex-row-reverse">
              <Button
                className="w-24 float-right"
                disabled={!isAddress(address, { strict: false })}
                onMouseDown={() => {
                  if (modalType === "edit") {
                    changeSubname("edit");
                  } else {
                    changeSubname("set");
                  }
                }}
              >
                Save
              </Button>
              {editTab === "subname" && modalType === "edit" && (
                <Button
                  variant="outline"
                  className=" hover:bg-red-400 border-red-400 border text-red-400 w-24"
                  onMouseDown={() => changeSubname("delete")}
                >
                  Delete
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full  text-neutral-300 text-center -mt-4">
              Edit onchain names at{" "}
              <Link
                target="_blank"
                href={`https://app.ens.domains/${name?.name}`}
              >
                <span className=" text-emerald-400 transition-colors duration-300 hover:text-emerald-500 underline">
                  ens.domains
                </span>
              </Link>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubnameInput({
  error,
  subname,
  basename,
  disabled = false,
  nameType,
  setSubname,
}: {
  error: string;
  subname: string;
  basename: string;
  disabled?: boolean;
  nameType?: string; // Assuming 'SubnameType' is defined somewhere
  setSubname: (value: string) => void;
}) {
  // State to track if the input is focused
  const [isFocused, setIsFocused] = useState(false);

  // Function to handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Function to handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };

  // //useEffect to prevent the input from being focused immediately
  // useEffect(() => {
  //   if (disabled) {
  //     setIsFocused(false);
  //   }
  // }, [disabled]);

  return (
    <>
      <div className="flex">
        <Input
          id="subname"
          className=" bg-neutral-750 focus-visible:ring-0 text-white rounded-r-none"
          value={subname}
          onChange={(e) => {
            setSubname(e.target.value);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={nameType === "onchain" || disabled}
          placeholder="Enter Name"
        />
        <div
          className={`flex text-sm px-2 rounded-l-none items-center bg-neutral-750 rounded-md shadow-sm whitespace-nowrap  ${
            isFocused ? "text-emerald-400" : "text-neutral-300"
          }`}
        >
          <span className="flex-shrink-0">.{basename}</span>
        </div>
      </div>
      <div className="text-red-500 ml-1 mt-2 font-mono text-xs h-5">
        {error !== "" && <div>{error}</div>}
      </div>
    </>
  );
}
