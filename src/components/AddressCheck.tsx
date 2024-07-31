import { isAddress } from "viem";

export default function AddressCheck({ address }: { address: string }) {
  return (
    <div className="text-red-500 ml-1 mt-2 font-mono text-xs h-5">
      {!isAddress(address, { strict: false }) && address !== "" && (
        <div>Invalid address</div>
      )}
    </div>
  );
}
