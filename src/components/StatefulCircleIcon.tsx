import { CheckCircledIcon, CircleIcon } from "@radix-ui/react-icons";

export function StatefulCircleIcon({
  checked,
  size = "w-7 h-7",
}: {
  checked: boolean;
  size?: string;
}) {
  return (
    <div>
      {checked ? (
        <CheckCircledIcon className={`${size} text-green-500`} />
      ) : (
        <CircleIcon className={`${size} text-slate-500`} />
      )}
    </div>
  );
}
