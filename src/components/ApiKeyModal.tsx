import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

// *** Wagmi/viem ***
import { useAccount } from "wagmi";
import { http, createClient, Address } from "viem";
import { mainnet } from "viem/chains";

// *** ENS ***
import { batch, getResolver, getOwner } from "@ensdomains/ensjs/public";
import { addEnsContracts } from "@ensdomains/ensjs";
import { setResolver } from "@ensdomains/ensjs/wallet";

// *** UI Components ***
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";

// *** Constants ***
const HYBRID_RESOLVER = "0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD";

const client = createClient({
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

export function ApiKeyModal({
  basename,
  trigger,
  fetchSubames,
}: {
  basename: string;
  trigger: React.ReactNode;
  fetchSubames: () => void;
}) {
  const [buttonText, setButtonText] = useState("Update");
  const [isOpen, setIsOpen] = useState(false);
  const [isNameWrapper, setIsNameWrapper] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [resolver, setResolver] = useState("");
  const [isResolverSet, setIsResolverSet] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const account = useAccount();

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      const [resolverResult, owner] = await batch(
        client,
        getResolver.batch({ name: basename }),
        getOwner.batch({ name: basename })
      );
      setResolver(resolverResult || "");
      if (owner?.ownershipLevel == "nameWrapper") {
        setIsNameWrapper(true);
      }

      if (resolverResult === HYBRID_RESOLVER) {
        setIsResolverSet(true);
      }
    } else {
      // reset state
      setResolver("");
      setTxStatus("");
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Enter Api Key</DialogTitle>
          <DialogDescription>
            You have previously managed this name using namestone. Enter your
            API key below manage it with ensone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <Input
            placeholder="API Key"
            className="w-full"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full items-center">
            <EnableButton
              buttonText={buttonText}
              domain={basename}
              apiKey={apiKey}
              account={
                account.address ||
                ("0x0000000000000000000000000000000000000000" as Address)
              }
              setButtonText={setButtonText}
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnableButton({
  domain,
  buttonText,
  setButtonText,
  apiKey,
  account,
}: {
  domain: string;
  buttonText: string;
  apiKey: string;
  setButtonText: (text: string) => void;
  account: Address;
}) {
  const [showSpinner, setShowSpinner] = useState(false);
  const router = useRouter();
  async function handleClick() {
    setShowSpinner(true);
    fetch(
      `/api/add-api-key?api_key=${apiKey}&address=${account}&domain=${domain}`
    ).then((response) => {
      if (response.ok) {
        window.location.reload();
      }
      setShowSpinner(false);
    });
  }

  return (
    <Button onMouseDown={handleClick} className="w-48">
      {" "}
      {showSpinner && (
        <Image
          src="/spinner.svg"
          alt="spinner"
          className="mr-2"
          width={16}
          height={16}
        />
      )}
      {buttonText}
    </Button>
  );
}
