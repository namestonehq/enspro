import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

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
import { normalize } from "viem/ens";
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
// *** Constants ***
const HYBRID_RESOLVER = "0xd17347fA0a6eeC89a226c96a9ae354F785e94241";

const client = createClient({
  chain: {
    ...addEnsContracts(mainnet),
    subgraphs: {
      ens: {
        url: process.env.SUBGRAPH_URL || "",
      },
    },
  },
  transport: http(process.env.MAINNET_RPC || ""),
});

const publicClient = createPublicClient({
  batch: { multicall: true },
  chain: mainnet,
  transport: http(process.env.MAINNET_RPC || ""),
});

export function EnableModal({
  basename,
  refetchSubnames,
  trigger,
}: {
  basename: string;
  refetchSubnames: () => void;
  trigger: React.ReactNode;
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
              href="https://etherscan.io/address/0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD"
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
          <div className="rounded-lg w-full mb-2 text-neutral-300 bg-neutral-700 ring-0 ring-slate-300 pl-2 pr-4 py-2 font-mono text-sm">
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
}) {
  const [showSpinner, setShowSpinner] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!enabled) {
      if (resolver !== HYBRID_RESOLVER && account) {
        const wallet = createWalletClient({
          chain: addEnsContracts(mainnet),
          transport: custom(window.ethereum),
        });

        try {
          setTxStatus("Waiting for approval...");
          setButtonText("");
          setShowSpinner(true);
          const domainInfo = await getOnchainDomainInfo(domain);
          console.log(domainInfo);
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
          } catch (error) {
            setTxStatus("error");
            setButtonText("Update");
            console.error(error);
          }
          fetch(`/api/get-api-key?domain=${domain}`).then((response) => {
            if (response.ok) {
              console.log("API key fetched successfully");
              // set domain to domainInfo on namestone
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
                if (response.ok) {
                  console.log("Domain info saved successfully");
                } else {
                  console.error("Failed to save domain info");
                }
              });
              refetchSubnames();
              toast.success("Resolver changed successfully");
            } else {
              console.error("Failed to fetch API key");
            }
          });
        } catch (error) {
          // tx error
          setTxStatus("error");
          setButtonText("Update");
          setShowSpinner(false);
          console.error(error);
        }
      }
    } else {
      router.push(`/manage?name=${domain}`);
    }
  }

  return (
    <Button onClick={handleClick} className="w-24">
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
