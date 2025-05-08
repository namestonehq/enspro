"use client";
import { Button } from "../components/ui/button";
import NavBar from "../components/nav-bar";
import { Address, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getResolver } from "@ensdomains/ensjs/public";
import { addEnsContracts, ensSubgraphActions } from "@ensdomains/ensjs";
import { ExclamationTriangleIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { EnableModal } from "../components/EnableModal";
import { useAccount, useWalletClient } from "wagmi";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";
import Image from "next/image";
import Link from "next/link";
import _ from "lodash";
import SubnameModal from "../components/SubnameModal";
import DomainModal from "../components/DomainModal";

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

  const [isEnable, setIsEnable] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const [refetch, setRefetch] = useState(0);
  const account = useAccount();
  const router = useRouter();

  const { data: walletClient } = useWalletClient();

  //UseEffect to return to main page if not connected
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  useEffect(() => {
    // Set a flag after initial load to avoid redirect during page refresh
    if (!initialLoadComplete) {
      // Wait a moment to allow wallet reconnection
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    // Only redirect if we're sure the user is disconnected after initial load
    if (initialLoadComplete && !account.address) {
      router.push("/");
    }
  }, [account.address, router, initialLoadComplete]);

  useEffect(() => {
    if (searchParams.get("name")) {
      setbasename(searchParams.get("name") || "");
    }
  }, [searchParams]);

  const goodResolvers = [
    "0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD",
    "0xd17347fA0a6eeC89a226c96a9ae354F785e94241",
    "0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65",
    "0xA87361C4E58B619c390f469B9E6F27d759715125", // most current
  ];

  function refetchSubnames() {
    setRefetch((prev) => prev + 1);
  }

  const fetchResolver = async () => {
    try {
      console.log("Fetching resolver for", basename);
      setLoading(true);
      const result = await getResolver(client, { name: basename });

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
      if (!walletClient) {
        return "wallet client not found";
      }

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
      // set enable to true
      setIsEnable(true);
      // refetch the subnames
      refetchSubnames();
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
                      setIsEnable={setIsEnable}
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
                {/* Get Signature */}
                {isEnable && !hasApiKey && (
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
                )}
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
