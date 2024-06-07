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
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { EnableModal } from "../components/EnableModal";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

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
  const account = useAccount();

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

  const fetchResolver = async () => {
    try {
      console.log("Fetching resolver for", basename);
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
  }, [basename, isEnable]); // Dependency array includes `name`

  return (
    <main className="flex min-h-screen flex-col px-2 sm:px-8 max-w-5xl mx-auto">
      {/* Nav Bar */}
      <NavBar />
      {/* Main Content */}
      <div className="flex flex-col">
        {/* Welcome */}
        <div className="text-center my-8">Personal Subname Management</div>

        {/* Box */}
        <div className="flex shadow-lg w-full sm:w-[800px] min-h-[480px] p-8 flex-col border border-slate-200 rounded mx-auto">
          <div className="mb-4">
            <div className="flex justify-between">
              <div>
                Subnames for
                <span className=" bg-slate-100 py-1 px-2 rounded">
                  {basename}
                </span>
              </div>
              <div className="text-xl font-mono text-blue-600">
                {loading
                  ? "Loading..."
                  : !isEnable
                  ? "Incorrect Resolver"
                  : !hasApiKey
                  ? "Missing API Key"
                  : "Ready to Manage"}
              </div>
              {/* <div className="flex items-center">
                <Label htmlFor="api-key-input" className="mr-2">
                  Key
                </Label>
                <ApiKeyInput value={apiKey} onChange={handleApiKeyChange} />
              </div> */}
            </div>
          </div>
          <div className="w-full mt-8 flex justify-between items-center">
            <div className="font-mono text-sm">Subnames: {subnames.length}</div>
            <AddSubnameModal
              disabled={!isEnable || !hasApiKey}
              basename={basename}
              newbasename={offchainNames == 0}
            />
          </div>
          <hr className="my-4" />
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
          <div className="grid sm:grid-cols-2 grid-cols-2 gap-4">
            {subnames.map((name, index) => (
              <NameCard key={index} name={name} basename={basename} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function NameCard({ name, basename }: { name: Subname; basename: string }) {
  const [subname, setSubname] = useState(name.labelName || "");
  const [address, setAddress] = useState(name.resolvedAddress || "");

  const handleEditSubname = async () => {
    const originalName = name.labelName || ""; // The original subname
    await manageSubname({
      method: "edit",
      name: subname,
      basename: basename,
      resolvedAddress: address as Address,
      originalName: originalName,
    });
  };

  const handleDeleteSubname = async () => {
    await manageSubname({
      method: "delete",
      name: subname,
      basename: basename,
      resolvedAddress: address as Address,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer   w-80 p-4 flex flex-col border rounded  gap-2 hover:bg-slate-50">
          <div className="flex justify-between">
            <div className="text-sm">{name?.name || ""}</div>
            <div
              className={`text-xs flex items-center rounded-lg px-2 ${
                name?.nameType === "onchain"
                  ? " bg-sky-50 text-sky-400"
                  : " bg-orange-50 text-orange-400"
              }`}
            >
              {name?.nameType}
            </div>
          </div>
          <div className="text-xs text-slate-500  font-mono font-thin">
            {name?.resolvedAddress && shortenAddress(name.resolvedAddress)}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex">
            {name.nameType === "onchain" ? "View Subname" : "Edit Subname"}
          </DialogTitle>
        </DialogHeader>
        <div className="">
          <Label htmlFor="subname" className="text-right">
            Subname
            {/* <div
              className={`text-xs flex items-center rounded-lg px-2 ${
                name?.nameType === "onchain"
                  ? " bg-sky-50 text-sky-400"
                  : " bg-orange-50 text-orange-400"
              }`}
            >
              {name?.nameType}
            </div> */}
          </Label>
          <SubnameInput
            setSubname={setSubname}
            subname={subname}
            basename={basename}
            nameType={name.nameType}
          />
        </div>
        <div className="">
          <Label htmlFor="address" className="text-right">
            Address
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="col-span-3 text-xs"
            disabled={name.nameType === "onchain"}
          />
        </div>

        <DialogFooter>
          <div className="flex w-full content-between justify-between">
            <Button
              variant="outline"
              className=" text-red-500"
              onClick={handleDeleteSubname}
            >
              Delete
            </Button>
            <Button onClick={handleEditSubname}>Save</Button>
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
  newbasename,
}: {
  basename: string;
  disabled: boolean;
  newbasename: boolean;
}) {
  const [subname, setSubname] = useState("");
  const [address, setAddress] = useState("");

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
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="text-sm w-12">
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Subname</DialogTitle>
        </DialogHeader>

        <div className="">
          <Label htmlFor="subname" className="text-right">
            Subname
          </Label>
          <SubnameInput
            subname={subname}
            basename={basename}
            setSubname={setSubname}
          />
        </div>
        <div className="">
          <Label htmlFor="address" className="text-right">
            Address
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="col-span-3"
          />
        </div>

        <DialogFooter>
          <Button onClick={handleAddSubname}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  nameType?: SubnameType;
  setSubname: (value: string) => void;
}) {
  return (
    <div className="flex">
      <Input
        id="subname"
        className="border-r-0  focus-visible:ring-0 rounded-r-none"
        value={subname}
        onChange={(e) => setSubname(e.target.value)}
        disabled={nameType === "onchain" || disabled}
      />
      <div className="flex text-sm  px-2 rounded-l-none items-center border rounded-md shadow-sm border-l-0">
        <span className=" opacity-50">.{basename}</span>
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
      // Handle the response data as needed
      window.location.reload();
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
    <div className="flex mb-4 text-indigo-500 text-sm rounded-lg p-3 items-center justify-between w-full h-14 bg-indigo-50">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon width={16} height={16} />
        Switch resolver to add subnames.
      </div>
      <EnableModal
        basename={basename}
        trigger={<Button>Switch Resolver</Button>}
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
