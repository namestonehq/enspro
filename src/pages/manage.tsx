"use client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import NavBar from "../components/nav-bar";
import { Address, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getResolver } from "@ensdomains/ensjs/public";
import { addEnsContracts, ensSubgraphActions } from "@ensdomains/ensjs";
import { ExclamationTriangleIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { EnableModal } from "../components/EnableModal";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import AddressCheck from "../components/AddressCheck";
import Footer from "../components/Footer";
import Image from "next/image";
import Link from "next/link";
import _ from "lodash";
import toast, { Toaster } from "react-hot-toast";
import SubnameModal from "../components/SubnameModal";
import DomainModal from "../components/DomainModal";

import { createWalletClient, custom } from "viem";

const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum!),
});

const client = createPublicClient({
  batch: { multicall: true },
  chain: {
    ...addEnsContracts(mainnet),
    subgraphs: {
      ens: {
        url: process.env.SUBGRAPH_URL || "",
      },
    },
  },
  transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC || ""),
});

export default function Manage() {
  const searchParams = useSearchParams();
  const [subnames, setSubnames] = useState<Subname[]>([]);
  const [basename, setbasename] = useState(searchParams?.get("name") || "");
  const [loading, setLoading] = useState(true);
  const [resolver, setResolver] = useState("");
  const [isEnable, setIsEnable] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [offchainNames, setOffchainNames] = useState(0);
  const [refetch, setRefetch] = useState(0);
  const account = useAccount();
  const router = useRouter();

  //UseEffect to return to main page if not connected
  useEffect(() => {
    if (!account.address) {
      router.push("/");
    }
  }, [account.address, router]);

  useEffect(() => {
    if (searchParams.get("name")) {
      setbasename(searchParams.get("name") || "");
    }
  }, [searchParams]);

  const goodResolvers = [
    "0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD",
    "0xd17347fA0a6eeC89a226c96a9ae354F785e94241",
    "0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65",
  ];

  function refetchSubnames() {
    setRefetch((prev) => prev + 1);
  }

  const fetchResolver = async () => {
    try {
      console.log("Fetching resolver for", basename);
      setLoading(true);
      const result = await getResolver(client, { name: basename });
      setResolver(result as string);
      if (goodResolvers.includes(result || "")) {
        setIsEnable(true);
      } else {
        setIsEnable(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching resolver:", error);
    }
  };

  const fetchSubnames = async () => {
    try {
      const response = await fetch(
        `/api/get-subnames?name=${basename}&address=${account.address}`
      );

      setLoading(false);
      if (response.ok) {
        setHasApiKey(true);
        const displayedData = await response.json();

        setSubnames([...displayedData]);
        setOffchainNames(
          displayedData.filter((name: Subname) => name.nameType === "offchain")
            .length
        );
      } else {
        console.error("Failed to fetch names");
      }
    } catch (error) {
      console.error("Error fetching names:", error);
    }
  };

  useEffect(() => {
    if (!basename) return; // Guard clause to prevent fetching with an empty name
    fetchResolver();
    // wait a sec then fetch
    fetchSubnames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basename, isEnable, refetch]); // Dependency array includes `name`

  const handleSign = async () => {
    try {
      // Step 1: Get the SIWE message from the backend
      const response = await fetch("/api/get-siwe-message");
      if (!response.ok) {
        throw new Error("Failed to get SIWE message");
      }

      const { message } = await response.json();

      // Step 2: Ensure the account is defined
      if (!account || !account.address) {
        throw new Error("Account is not defined or does not have an address.");
      }

      // Step 3: Sign the retrieved SIWE message
      const sig = await walletClient.signMessage({
        account: account.address, // The user's Ethereum address
        message: message, // Use the SIWE message here
      });

      console.log("Signature:", sig);

      // Step 4: Enable the domain using the signed message
      const enableResponse = await fetch("/api/enable-domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: basename,
          signature: sig,
        }),
      });

      if (!enableResponse.ok) {
        const errorData = await enableResponse.json();
        throw new Error(
          `Failed to enable domain: ${errorData.error || "Unknown error"}`
        );
      }

      const apiKeyData = await enableResponse.json();
      console.log("API Key:", apiKeyData.message);
    } catch (error) {
      console.error("Error during enabling domain:", error);
    }
  };

  return (
    <div className="bg-grid bg-neutral-900 -z-20">
      {/* Nav Bar */}
      <NavBar />

      <main className="flex min-h-screen flex-col px-2 sm:px-8 max-w-5xl mx-auto">
        {/* Main Content */}

        <div className="flex  flex-col">
          <div className="  lg:pl-16">
            <Button
              onMouseDown={() => {
                router.push("/");
              }}
              className="text-white hover:bg-neutral-800 self-start bg-transparent hover:text-emerald-500 hover:bg-transparent"
            >
              <ArrowLeftIcon />
              Back
            </Button>
          </div>

          {/* Box */}
          <div className="flex shadow-lg w-full max-w-[800px] min-h-[480px]  bg-neutral-800  p-8 flex-col rounded mx-auto">
            <div className="flex text-white justify-between items-start">
              <div className="flex items-center">
                <div className="text-white flex text-center text-lg font-bold items-center flex-wrap">
                  <div className="flex divide-x  divide-neutral-600 bg-neutral-750  rounded-md mr-2">
                    <div className="p-2 text-base">
                      <span className="mx-1 ">{basename}</span>
                    </div>
                    {hasApiKey && (
                      <DomainModal
                        basename={basename}
                        trigger={
                          <button className="p-2 px-3  rounded-md transition-colors duration-300 flex hover:rounded-tl-none hover:rounded-bl-none rounded-tl-none  rounded-bl-none hover:rounded-md hover:rounded-tr-md hover:bg-neutral-600 items-center">
                            <Image
                              width={18}
                              height={18}
                              src="/edit-icon.svg"
                              alt="edit name"
                            />
                          </button>
                        }
                      />
                    )}
                  </div>
                  <span className="text-neutral-300  text-base font-normal">
                    (
                    {loading
                      ? "loading..."
                      : subnames.length.toString() +
                        (subnames.length == 1 ? " Subname" : " Subnames")}
                    )
                  </span>
                </div>
              </div>

              <div>
                <div className="w-full flex text-white items-center">
                  <SubnameModal
                    name={undefined}
                    basename={basename}
                    refetchSubnames={refetchSubnames}
                    existingSubnames={subnames}
                    modalType="add"
                  >
                    <Button
                      disabled={!isEnable || !hasApiKey}
                      className="text-sm w-24"
                    >
                      Add
                    </Button>
                  </SubnameModal>
                </div>
              </div>
            </div>

            <hr className="my-4  border-neutral-750" />
            {loading ? (
              <div className="flex flex-col  justify-center items-center flex-1">
                <Image
                  src="/loading-spinner.svg"
                  alt="spinner"
                  className="mr-2 text-white"
                  width={32}
                  height={32}
                />
                <div className=" text-neutral-300 mt-4">
                  Loading subnames...
                </div>
              </div>
            ) : (
              <div>
                {!loading && !isEnable && (
                  <div className="flex mb-4 text-neutral-300 text-sm rounded-lg p-3 items-center justify-between w-full h-14 bg-neutral-700">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon
                        className=" text-amber-300"
                        width={16}
                        height={16}
                      />
                      Update resolver to{" "}
                      {subnames.length === 0 ? "add" : "edit"} subnames.
                    </div>
                    <EnableModal
                      basename={basename}
                      refetchSubnames={refetchSubnames}
                      trigger={
                        <Button
                          variant="outline"
                          className=" border-green-500 hover:bg-emerald-500"
                        >
                          Update Resolver
                        </Button>
                      }
                    />
                  </div>
                )}
                {!loading && isEnable && !hasApiKey && (
                  <GetApiKeyMessage
                    basename={basename}
                    address={account.address || ""}
                    fetchSubnames={fetchSubnames}
                  />
                )}
                {!loading && isEnable && !hasApiKey && (
                  <EnterApiKeyMessage
                    basename={basename}
                    fetchSubnames={fetchSubnames}
                  />
                )}
                {/* Get Signature */}
                <div className="flex mb-4 text-neutral-300 text-sm rounded-lg p-3 items-center justify-between w-full h-14 bg-neutral-700">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon
                      className=" text-amber-300"
                      width={16}
                      height={16}
                    />
                    Sign the message to prove name ownership.
                  </div>
                  <Button
                    variant="outline"
                    className=" border-green-500 hover:bg-emerald-500"
                    onClick={handleSign}
                  >
                    Sign
                  </Button>
                </div>
                <div>
                  {subnames.length === 0 && hasApiKey ? (
                    <div className="text-neutral-300 text-center flex-col flex mt-4">
                      Add subnames to manage them.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                      {subnames.map((name, index) => (
                        <SubnameCard
                          lowOpacity={isEnable ? false : true}
                          key={index}
                          name={name}
                          basename={basename}
                          refetchSubnames={refetchSubnames}
                          existingSubnames={subnames}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SubnameCard({
  lowOpacity,
  name,
  basename,
  refetchSubnames,
  existingSubnames,
}: {
  lowOpacity: boolean;
  name: Subname;
  basename: string;
  refetchSubnames: () => void;
  existingSubnames: Subname[];
}) {
  const [hovering, setHovering] = useState(false);
  return (
    <SubnameModal
      name={name}
      basename={basename}
      refetchSubnames={refetchSubnames}
      existingSubnames={existingSubnames}
      modalType="edit"
    >
      <div
        className={`${
          lowOpacity ? "opacity-50 pointer-events-none" : ""
        } cursor-pointer group hover:bg-neutral-700 transition-colors duration-300 bg-neutral-750  grow p-4 flex flex-row rounded justify-between gap-2 `}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="flex flex-col">
          <div className="text-sm  ">
            <Link
              href={`https://app.ens.domains/${
                name?.labelName + "." + basename
              }`}
              target="_blank"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <span
                className={` ${
                  name?.nameType === "offchain"
                    ? "text-emerald-400"
                    : "text-white/70"
                }`}
              >
                {name?.labelName || ""}.
              </span>
              <span className="text-white">{basename || ""}</span>
            </Link>
          </div>

          <div className="text-xs text-white flex justify-between  font-mono font-thin">
            <div className="flex gap-2 items-start">
              <Link
                href={`https://etherscan.io/address/${name.resolvedAddress}`}
                target="_blank"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {name?.resolvedAddress && shortenAddress(name.resolvedAddress)}
              </Link>
            </div>
          </div>
        </div>

        {hovering && name?.nameType === "offchain" ? (
          <div>
            <Image
              width={18}
              height={18}
              src="/edit-icon.svg"
              alt="edit name"
            />
          </div>
        ) : (
          <div
            className={`text-xs flex items-center  rounded-lg px-2 h-5 ${
              name?.nameType === "offchain"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-neutral-600 text-white/70"
            }`}
          >
            {name?.nameType}
          </div>
        )}
      </div>
    </SubnameModal>
  );
}

function shortenAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function GetApiKeyMessage({
  basename,
  address,
  fetchSubnames,
}: {
  basename: string;
  address: string;
  fetchSubnames: () => void;
}) {
  const [buttonText, setButtonText] = useState("Get Key");
  function getApiKey() {
    setButtonText("Getting Key...");
    fetch(`/api/get-api-key?domain=${basename}`).then((response) => {
      if (response.ok) {
        console.log("API key fetched successfully");
        setButtonText("Key Fetched");
        fetchSubnames();
      } else {
        console.error("Failed to fetch API key");
        setButtonText("Failed to fetch key");
      }
    });
  }

  return (
    <div className="flex mb-4 text-indigo-500 text-sm rounded-lg p-3 items-center justify-between w-full h-14 bg-indigo-50">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon width={16} height={16} />
        Get an API key to manage subnames.
      </div>
      <Button onMouseDown={getApiKey}>{buttonText}</Button>
    </div>
  );
}

function EnterApiKeyMessage({
  basename,
  fetchSubnames,
}: {
  basename: string;
  fetchSubnames: () => void;
}) {
  return (
    <div className="flex mb-4 text-orange-500 text-sm rounded-lg p-3 items-center justify-between w-full h-14 bg-orange-50">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon width={16} height={16} />
        Managed name through namestone? Enter your API key.
      </div>
      <ApiKeyModal
        basename={basename}
        fetchSubames={fetchSubnames}
        trigger={<Button>Enter Key</Button>}
      />
    </div>
  );
}

function EditDomainModal({
  basename,
  trigger,
}: {
  basename: string;
  trigger: React.ReactNode;
}) {
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [open, setOpen] = useState(false);
  // useEffect to set domainInfo
  useEffect(() => {
    fetch(`/api/get-domain?domain=${basename}`).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          console.log("Domain Info:", data);
          setDomainInfo(data);
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
        ...domainInfo,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[520px] max-h-[420px] sm:max-h-full overflow-y-auto  bg-neutral-800"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-white mb-1 font-bold">
            Edit Name
          </DialogTitle>
          <div className=" text-emerald-500 font-bold">{basename}</div>
        </DialogHeader>
        <div className="flex flex-col">
          <div>
            <div className="flex text-white text-sm font-bold mb-2 mt-2 gap-2 items-center">
              Eth Address
            </div>
            <Input
              id="address"
              value={domainInfo?.address || ""}
              onChange={(e) => {
                const tempDomainInfo = _.cloneDeep(domainInfo);
                if (!tempDomainInfo) {
                  return;
                }
                tempDomainInfo.address = e.target.value;
                setDomainInfo(tempDomainInfo);
              }}
              className=" bg-neutral-750 focus-visible:ring-1 transition-shadow duration-300  placeholder:text-neutral-500  text-sm font-mono text-neutral-300 rounded"
              // disabled={name.nameType === "onchain"}
              placeholder="0x123..."
            />
            <AddressCheck address={domainInfo?.address || ""} />
          </div>
          <div>
            <div className="flex text-white text-sm font-bold mb-2 mt-2 gap-2 items-center">
              Description
            </div>
            <Input
              id="description"
              value={domainInfo?.text_records?.description || ""}
              onChange={(e) => {
                const tempDomainInfo = _.cloneDeep(domainInfo);
                if (!tempDomainInfo) {
                  return;
                }
                tempDomainInfo.text_records.description = e.target.value;
                setDomainInfo(tempDomainInfo);
              }}
              className=" bg-neutral-750 focus-visible:ring-1 transition-shadow duration-300  placeholder:text-neutral-500 text-sm  text-neutral-300 rounded"
              // disabled={name.nameType === "onchain"}
              placeholder="i'm a web3 developer"
            />
          </div>
          <div className="mt-2">
            <div className="flex text-white text-sm font-bold mb-2 mt-2 gap-2 items-center">
              Avatar
            </div>
            <Input
              id="avatar"
              value={domainInfo?.text_records?.avatar || ""}
              onChange={(e) => {
                const tempDomainInfo = _.cloneDeep(domainInfo);
                if (!tempDomainInfo) {
                  return;
                }
                tempDomainInfo.text_records.avatar = e.target.value;
                setDomainInfo(tempDomainInfo);
              }}
              className=" bg-neutral-750 focus-visible:ring-1 transition-shadow duration-300 placeholder:text-neutral-500 text-sm  text-neutral-300 rounded"
              // disabled={name.nameType === "onchain"}
              placeholder="url for avatar"
            />
          </div>
          <div className="mt-2">
            <div className="flex text-white text-sm font-bold mb-2 mt-2 gap-2 items-center">
              Location
            </div>
            <Input
              id="location"
              value={domainInfo?.text_records?.location || ""}
              onChange={(e) => {
                const tempDomainInfo = _.cloneDeep(domainInfo);
                if (!tempDomainInfo) {
                  return;
                }
                tempDomainInfo.text_records.location = e.target.value;
                setDomainInfo(tempDomainInfo);
              }}
              className=" bg-neutral-750 focus-visible:ring-1 transition-shadow duration-300 placeholder:text-neutral-500 text-sm  text-neutral-300 rounded"
              // disabled={name.nameType === "onchain"}
              placeholder="new york city"
            />
          </div>

          <hr className="mt-5 mb-5 border-neutral-750" />
          {/* LINKS */}
          <div className="flex text-white text-sm font-bold mb-2 gap-2 items-center">
            Links
          </div>
          <div className="relative mb-8">
            <Image
              className="absolute top-1/2 left-2 -translate-y-1/2"
              src="icon-x.svg"
              alt="x / twitter"
              width={16}
              height={16}
            />
            <Input
              id="X"
              value={domainInfo?.text_records?.["com.twitter"] || ""}
              onChange={(e) => {
                const tempDomainInfo = _.cloneDeep(domainInfo);
                if (!tempDomainInfo) {
                  return;
                }
                tempDomainInfo.text_records["com.twitter"] = e.target.value;
                setDomainInfo(tempDomainInfo);
              }}
              className="bg-neutral-750  pl-8 text-sm focus-visible:ring-1 transition-shadow duration-300 text-neutral-300 placeholder:text-neutral-500 rounded "
              // disabled={name.nameType === "onchain"}
              placeholder="namestonehq"
            />
          </div>
          <div className="relative mb-8">
            <Image
              className="absolute top-1/2 left-2 -translate-y-1/2"
              src="icon-github.svg"
              alt="github"
              width={16}
              height={16}
            />
            <Input
              id="github"
              value={domainInfo?.text_records?.["com.github"] || ""}
              onChange={(e) => {
                const tempDomainInfo = _.cloneDeep(domainInfo);
                if (!tempDomainInfo) {
                  return;
                }
                tempDomainInfo.text_records["com.github"] = e.target.value;
                setDomainInfo(tempDomainInfo);
              }}
              className=" bg-neutral-750 text-sm pl-8 focus-visible:ring-1 transition-shadow duration-300  text-neutral-300 placeholder:text-neutral-500 rounded "
              placeholder="resolverworks"
            />
          </div>
          <div className="relative mb-8">
            <Image
              className="absolute top-1/2 left-2 -translate-y-1/2"
              src="icon-discord.svg"
              alt="discord"
              width={16}
              height={16}
            />
            <Input
              id="discord"
              value={domainInfo?.text_records?.["com.discord"] || ""}
              onChange={(e) => {
                const tempDomainInfo = _.cloneDeep(domainInfo);
                if (!tempDomainInfo) {
                  return;
                }
                tempDomainInfo.text_records["com.discord"] = e.target.value;
                setDomainInfo(tempDomainInfo);
              }}
              className=" bg-neutral-750  pl-8 text-sm transition-shadow duration-300  focus-visible:ring-1  text-neutral-300 placeholder:text-neutral-500 rounded"
              placeholder="slobo.eth"
            />
          </div>
          <div className="relative mb-4">
            <Image
              className="absolute top-1/2 left-2 -translate-y-1/2"
              src="icon-link.svg"
              alt="website"
              width={16}
              height={16}
            />
            <Input
              id="website"
              value={domainInfo?.text_records?.url || ""}
              onChange={(e) => {
                const tempDomainInfo = _.cloneDeep(domainInfo);
                if (!tempDomainInfo) {
                  return;
                }
                tempDomainInfo.text_records.url = e.target.value;
                setDomainInfo(tempDomainInfo);
              }}
              className=" bg-neutral-750 text-sm  pl-8  transition-shadow duration-300 focus-visible:ring-1  text-neutral-300 placeholder:text-neutral-500 rounded "
              placeholder="www.namestone.xyz"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onMouseDown={saveDomainInfo} className="w-24">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
