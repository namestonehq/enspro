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
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getResolver } from "@ensdomains/ensjs/public";
import { addEnsContracts } from "@ensdomains/ensjs";
import { ExclamationTriangleIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { EnableModal } from "../components/EnableModal";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";
import Footer from "../components/Footer";
import Image from "next/image";

const client = createPublicClient({
  chain: addEnsContracts(mainnet),
  transport: http(),
});

export default function Home() {
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

  console.log(searchParams.get("name"));
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

  function doRefetch() {
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
        setSubnames(displayedData);
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

  // Effect to run fetchSubnames whenever `name` changes
  useEffect(() => {
    if (!basename) return; // Guard clause to prevent fetching with an empty name
    fetchResolver();
    if (isEnable) {
      fetchSubnames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basename, isEnable, refetch]); // Dependency array includes `name`

  return (
    <div className="bg-grid bg-neutral-900 -z-20">
      {/* Nav Bar */}
      <NavBar />

      <main className="flex min-h-screen flex-col px-2 sm:px-8 max-w-5xl mx-auto">
        {/* Main Content */}
        <div className="text-xl absolute right-1 font-mono text-blue-600">
          {loading
            ? "Loading..."
            : !isEnable
            ? "Incorrect Resolver"
            : !hasApiKey
            ? "Missing API Key"
            : "Ready to Manage"}
        </div>
        <div className="flex  flex-col">
          <div className="  lg:pl-16">
            <Button
              onClick={() => {
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
            <div className="flex text-white justify-between items-center">
              <div className="flex items-center">
                <div className="text-white flex text-center text-lg font-bold items-center">
                  {basename}
                  <span className="text-neutral-300 ml-1 text-base font-normal">
                    ({loading ? "loading..." : subnames.length})
                  </span>
                </div>
              </div>

              <div>
                <div className="w-full flex text-white items-center">
                  <AddSubnameModal
                    disabled={!isEnable || !hasApiKey}
                    basename={basename}
                    doRefetch={doRefetch}
                  />
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
                  <SwitchResolverMessage basename={basename} />
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
                <div>
                  {subnames.length === 0 && hasApiKey ? (
                    <div className="text-neutral-300 text-center flex-col flex mt-4">
                      Add subnames to manage them.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                      {subnames.map((name, index) => (
                        <NameCard
                          key={index}
                          name={name}
                          basename={basename}
                          doRefetch={doRefetch}
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

function NameCard({
  name,
  basename,
  doRefetch,
}: {
  name: Subname;
  basename: string;
  doRefetch: () => void;
}) {
  const [subname, setSubname] = useState(name.labelName || "");
  const [address, setAddress] = useState(name.resolvedAddress || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSubname(name.labelName || "");
    setAddress(name.resolvedAddress || "");
  }, [name]);

  const handleEditSubname = async () => {
    const originalName = name.labelName || ""; // The original subname
    await manageSubname({
      method: "edit",
      name: subname,
      basename: basename,
      resolvedAddress: address as Address,
      originalName: originalName,
    });
    doRefetch();
    setOpen(false);
  };

  const handleDeleteSubname = async () => {
    await manageSubname({
      method: "delete",
      name: subname,
      basename: basename,
      resolvedAddress: address as Address,
    });
    doRefetch();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:bg-neutral-700 transition-colors  duration-300 bg-neutral-750  grow p-4 flex flex-col rounded  gap-2 ">
          <div className="flex justify-between">
            <div className="text-sm  ">
              <span
                className={`${
                  name?.nameType === "offchain"
                    ? "text-emerald-400"
                    : "text-white/70"
                }`}
              >
                {name?.labelName || ""}.
              </span>
              <span className="text-white">{basename || ""}</span>
            </div>
            <div
              className={`text-xs flex items-center  rounded-lg px-2 ${
                name?.nameType === "offchain"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-neutral-600 text-white/70"
              }`}
            >
              {name?.nameType}
            </div>
          </div>
          <div className="text-xs text-white  font-mono font-thin">
            {name?.resolvedAddress && shortenAddress(name.resolvedAddress)}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]  bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex text-white">
            {name.nameType === "onchain" ? "View Subname" : "Edit Subname"}
          </DialogTitle>
        </DialogHeader>
        <div className="">
          <div className="mb-2">
            <Label htmlFor="subname" className="text-right text-white">
              Subname
            </Label>
          </div>
          <SubnameInput
            setSubname={setSubname}
            subname={subname}
            basename={basename}
            nameType={name.nameType}
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
            className=" bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded"
            disabled={name.nameType === "onchain"}
            placeholder="0x123..."
          />
          <AddressCheck address={address} />
        </div>

        <DialogFooter>
          <div className="flex w-full content-between justify-between">
            <Button
              variant="outline"
              className=" hover:bg-red-400 border-red-400 border text-red-400 w-24"
              onClick={handleDeleteSubname}
            >
              Delete
            </Button>
            <Button
              className="w-24"
              disabled={!isAddress(address)}
              onClick={handleEditSubname}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function shortenAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function AddSubnameModal({
  basename,
  disabled,
  doRefetch,
}: {
  basename: string;
  disabled: boolean;
  doRefetch: () => void;
}) {
  const [subname, setSubname] = useState("");
  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);

  const handleAddSubname = async () => {
    await manageSubname({
      method: "set",
      name: subname,
      basename: basename,
      resolvedAddress: address as Address,
    });

    // Clear the input fields after adding the subname
    setSubname("");
    setAddress("");
    doRefetch();
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="text-sm w-24">
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]  bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add Subname</DialogTitle>
        </DialogHeader>

        <div className="">
          <div className="mb-2">
            <Label htmlFor="subname" className="text-right text-white">
              Subname
            </Label>
          </div>

          <SubnameInput
            subname={subname}
            basename={basename}
            setSubname={setSubname}
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
            className="col-span-3 focus-visible:ring-0 text-white font-mono text-xs bg-neutral-750 placeholder:text-nuetral-400 placeholder:text-sm"
            placeholder="0x..."
          />
          <AddressCheck address={address} />
        </div>

        <DialogFooter>
          <Button
            className="w-24"
            disabled={!isAddress(address)}
            onClick={handleAddSubname}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddressCheck({ address }: { address: string }) {
  return (
    <div className="text-red-500 ml-1 mt-2 font-mono text-xs h-5">
      {!isAddress(address) && address !== "" && <div>Invalid address</div>}
    </div>
  );
}

function SubnameInput({
  subname,
  basename,
  disabled = false,
  nameType,
  setSubname,
}: {
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

  return (
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
        className={`flex text-sm px-2 rounded-l-none items-center bg-neutral-750  rounded-md shadow-sm  ${
          isFocused ? " text-emerald-400 " : " text-neutral-300"
        }`}
      >
        <span>.{basename}</span>
      </div>
    </div>
  );
}

async function manageSubname({
  method,
  name,
  basename,
  resolvedAddress,
  originalName,
}: {
  method: ManageMethodType;
  name: string;
  basename: string;
  resolvedAddress: Address;
  originalName?: string;
}) {
  const body = {
    domain: basename,
    name: name,
    address: resolvedAddress,
    method: method,
    originalName: originalName,
  };

  try {
    const response = await fetch("/api/edit-name", {
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
    } else {
      console.error(`Failed to execute ${method} for subname`);
      // Handle the error case
    }
  } catch (error) {
    console.error(`Network Error method:${method}`, error);
    // Handle any network or other errors
  }
}

function SwitchResolverMessage({ basename }: { basename: string }) {
  return (
    <div className="flex mb-4 text-neutral-300 text-sm rounded-lg p-3 items-center justify-between w-full h-14 bg-neutral-700">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon
          className=" text-amber-300"
          width={16}
          height={16}
        />
        Switch resolver to add subnames.
      </div>
      <EnableModal
        basename={basename}
        trigger={
          <Button
            variant="outline"
            className=" border-green-500 hover:bg-emerald-500"
          >
            Switch Resolver
          </Button>
        }
      />
    </div>
  );
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
    fetch(`/api/get-api-key?address=${address}&domain=${basename}`).then(
      (response) => {
        if (response.ok) {
          console.log("API key fetched successfully");
          setButtonText("Key Fetched");
          fetchSubnames();
        } else {
          console.error("Failed to fetch API key");
          setButtonText("Failed to fetch key");
        }
      }
    );
  }

  return (
    <div className="flex mb-4 text-indigo-500 text-sm rounded-lg p-3 items-center justify-between w-full h-14 bg-indigo-50">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon width={16} height={16} />
        Get an API key to manage subnames.
      </div>
      <Button onClick={getApiKey}>{buttonText}</Button>
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
