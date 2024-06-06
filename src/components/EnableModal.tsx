import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

// *** Wagmi/viem ***
import { useAccount } from "wagmi";
import {
  http,
  createClient,
  createPublicClient,
  Address,
  createWalletClient,
  custom,
  Hex,
} from "viem";
import { mainnet } from "viem/chains";

// *** ENS ***
import { batch, getResolver, getOwner } from "@ensdomains/ensjs/public";
import { addEnsContracts } from "@ensdomains/ensjs";
import { setResolver } from "@ensdomains/ensjs/wallet";

// *** UI Components ***
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

// *** Constants ***
const HYBRID_RESOLVER = "0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD";

const client = createClient({
  chain: addEnsContracts(mainnet),
  transport: http(),
});

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export function EnableModal({
  basename,
  trigger,
}: {
  basename: string;
  trigger: React.ReactNode;
}) {
  const [buttonText, setButtonText] = useState("Update");
  const [isOpen, setIsOpen] = useState(false);
  const [isNameWrapper, setIsNameWrapper] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [resolver, setResolver] = useState("");
  const [isResolverSet, setIsResolverSet] = useState(false);
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
          <DialogTitle>Update Resolver</DialogTitle>
          <DialogDescription>
            To use ENS/ONE a different resolver is required. We use a{" "}
            <Link
              className="underline"
              href="https://etherscan.io/address/0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD"
              target="_blank"
            >
              verified resolver
            </Link>
            .
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="flex mb-2 mt-4 font-bold gap-2 items-center">
            Current Resolver
          </div>
          <div className="rounded-lg w-full mb-2 ring-1 ring-slate-300 text-slate-400 pl-2 pr-4 py-2 font-mono text-sm bg-slate-50">
            {resolver || "Loading..."}
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full items-center">
            <div>{txStatus && <StatusDisplay status={txStatus} />}</div>
            <EnableButton
              resolver={resolver}
              buttonText={buttonText}
              domain={basename}
              account={
                account.address ||
                ("0x0000000000000000000000000000000000000000" as Address)
              }
              setButtonText={setButtonText}
              enabled={isResolverSet}
              isNamewrapper={isNameWrapper}
              setTxStatus={setTxStatus}
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
  resolver,
  enabled,
  account,
  isNamewrapper,
  setTxStatus,
}: {
  domain: string;
  buttonText: string;
  setButtonText: (text: string) => void;
  resolver: string;
  enabled: boolean;
  account: Address;
  isNamewrapper: boolean;
  setTxStatus: (text: string) => void;
}) {
  const [showSpinner, setShowSpinner] = useState(false);
  const router = useRouter();

  if (enabled) {
    setButtonText("Manage Subnames");
  } else if (resolver === HYBRID_RESOLVER) {
    setButtonText("Add Text Record");
  }

  async function handleClick() {
    if (!enabled) {
      if (resolver !== HYBRID_RESOLVER && account) {
        await changeResolver({ domain, account, isNamewrapper, setTxStatus });
      }
    } else {
      router.push(`/manage?name=${domain}`);
    }
  }

  return (
    <Button onClick={handleClick} className="w-48">
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

// Changes resolver based on the nameWrapper status
async function changeResolver({
  domain,
  account,
  isNamewrapper,
  setTxStatus,
}: {
  domain: string;
  account: Address;
  isNamewrapper: boolean;
  setTxStatus: (text: string) => void;
}) {
  const wallet = createWalletClient({
    chain: addEnsContracts(mainnet),
    transport: custom(window.ethereum),
  });

  try {
    setTxStatus("Changing resolver...");
    const hash = await setResolver(wallet, {
      name: domain,
      contract: isNamewrapper ? "nameWrapper" : "registry",
      resolverAddress: HYBRID_RESOLVER,
      account: account,
    });
    await handleTransaction({ hash: hash, setTxStatus: setTxStatus });
  } catch (error) {
    handleTransactionError({ error: error, setTxStatus: setTxStatus });
  }
}

async function handleTransaction({
  hash,
  setTxStatus,
}: {
  hash: Hex;
  setTxStatus: (text: string) => void;
}) {
  setTxStatus("pending");
  try {
    const transaction = await publicClient.waitForTransactionReceipt({ hash });
    setTxStatus("success");
  } catch (error) {
    setTxStatus("error");
    console.error(error);
  }
}

async function handleTransactionError({
  error,
  setTxStatus,
}: {
  error: any;
  setTxStatus: (text: string) => void;
}) {
  setTxStatus("error");
  console.error(error);
}

function StatusDisplay({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{status}</span>
    </div>
  );
}
