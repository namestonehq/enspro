import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// *** Wagmi/viem ***
import { useAccount, useWalletClient } from "wagmi";
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
import { getOnchainDomainInfo } from "../lib/utils";
import { saveDomainInfoTemporarily } from "../lib/domainStorage";
// *** Constants ***
const HYBRID_RESOLVER = "0xA87361C4E58B619c390f469B9E6F27d759715125";

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

const publicClient = createPublicClient({
  batch: { multicall: true },
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC || ""),
});

export function EnableModal({
  basename,
  refetchSubnames,
  trigger,
  setIsEnable,
}: {
  basename: string;
  refetchSubnames: () => void;
  trigger: React.ReactNode;
  setIsEnable: (isEnable: boolean) => void;
}) {
  const [buttonText, setButtonText] = useState("Update");
  const [isOpen, setIsOpen] = useState(false);
  const [isNameWrapper, setIsNameWrapper] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txHash, setTxHash] = useState("");
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
      <DialogContent className="sm:max-w-[520px]  bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white mb-1">Update Resolver</DialogTitle>
          <DialogDescription className=" text-neutral-300">
            Update your resolver to enable ENSPro. We use a{" "}
            <Link
              className="underline text-emerald-400"
              href="https://etherscan.io/address/0xA87361C4E58B619c390f469B9E6F27d759715125"
              target="_blank"
            >
              verified resolver
            </Link>
            .
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="flex text-white mb-2 mt-4 gap-2 items-center">
            Current Resolver
          </div>
          <div className="rounded-lg w-full mb-2 text-neutral-300 bg-neutral-700 ring-0 ring-slate-300 pl-2 pr-4 py-2 font-mono text-sm break-all">
            {resolver || "Loading..."}
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full items-center">
            <div className=" text-neutral-300">
              {txStatus && <StatusDisplay txHash={txHash} status={txStatus} />}
            </div>
            <EnableButton
              resolver={resolver}
              buttonText={buttonText}
              domain={basename}
              refetchSubnames={refetchSubnames}
              account={
                account.address ||
                ("0x0000000000000000000000000000000000000000" as Address)
              }
              setButtonText={setButtonText}
              enabled={isResolverSet}
              isNamewrapper={isNameWrapper}
              setTxStatus={setTxStatus}
              setTxHash={setTxHash}
              setIsEnable={setIsEnable}
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnableButton({
  domain,
  refetchSubnames,
  buttonText,
  setButtonText,
  resolver,
  enabled,
  account,
  isNamewrapper,
  setTxStatus,
  setTxHash,
  setIsEnable,
}: {
  domain: string;
  refetchSubnames: () => void;
  buttonText: string;
  setButtonText: (text: string) => void;
  resolver: string;
  enabled: boolean;
  account: Address;
  isNamewrapper: boolean;
  setTxStatus: (text: string) => void;
  setTxHash: (hash: string) => void;
  setIsEnable: (isEnable: boolean) => void;
}) {
  const [showSpinner, setShowSpinner] = useState(false);
  const router = useRouter();
  const { data: walletClient } = useWalletClient();

  async function handleClick() {
    if (!enabled) {
      if (!walletClient) {
        toast.error("Wallet not connected");
        return;
      }
      if (resolver !== HYBRID_RESOLVER && account) {
        const wallet = createWalletClient({
          chain: addEnsContracts(mainnet),
          transport: custom(walletClient.transport),
        });

        try {
          setTxStatus("Waiting for approval...");
          setButtonText("");
          setShowSpinner(true);
          const domainInfo = await getOnchainDomainInfo(domain);
          console.log(domainInfo);
          // Save domain info temporarily until API key is obtained
          saveDomainInfoTemporarily(domain, domainInfo);
          
          const hash = await setResolver(wallet, {
            name: domain,
            contract: isNamewrapper ? "nameWrapper" : "registry",
            resolverAddress: HYBRID_RESOLVER,
            account: account,
          });
          setTxHash(hash);
          setTxStatus("pending");
          setButtonText("Pending");
          try {
            const transaction = await publicClient.waitForTransactionReceipt({
              hash,
            });
            setTxStatus("success");
            setButtonText("Success");
            setShowSpinner(false);
            setIsEnable(true);
            refetchSubnames();
          } catch (error) {
            // wait for txReciept is known to fail we display success anyhow
            setTxStatus("success");
            setButtonText("Success");
            setShowSpinner(false);
            console.error(error);
          }
        } catch (error) {
          // tx error
          setTxStatus("error");
          setButtonText("Update");
          setShowSpinner(false);
          console.error(error);
        } finally {
          // add domainInfo
        }
      }
    } else {
      router.push(`/manage?name=${domain}`);
    }
  }

  return (
    <Button onMouseDown={handleClick} className="w-24">
      {showSpinner && (
        <Image
          src="/loading-spinner.svg"
          alt="spinner"
          className={buttonText ? "mr-2" : ""}
          width={16}
          height={16}
        />
      )}
      {buttonText}
    </Button>
  );
}

function StatusDisplay({ status, txHash }: { status: string; txHash: string }) {
  console.log("StatusDisplay", status, txHash);
  return (
    <div className="flex  text-neutral-300 items-center gap-2">
      <span>
        {status === "error" ? (
          <div className="flex items-center text-red-400">
            <Image
              src="/icon-error.svg"
              alt="error"
              className="mr-2"
              width={16}
              height={16}
            />
            Error
          </div>
        ) : status === "updating" ? (
          <div className="flex items-center">
            <Image
              src="/updating-icon.svg" // Ensure you have an icon for updating status
              alt="updating"
              className="mr-2"
              width={16}
              height={16}
            />
          </div>
        ) : txHash !== "" && (status === "pending" || status === "success") ? (
          <div className="flex items-center">
            {status === "pending" && ""}
            Transaction {status}:{" "}
            <Link target="_blank" href={`https://etherscan.io/tx/${txHash}`}>
              <Image
                src="/etherscan-logo.svg"
                alt="etherscan"
                className="ml-2"
                width={14}
                height={14}
              />
            </Link>{" "}
          </div>
        ) : (
          <div>{status}</div>
        )}
      </span>
    </div>
  );
}
