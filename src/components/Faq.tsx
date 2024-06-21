export default function Faq() {
  return (
    <div className="flex gap-4 flex-col w-full max-w-[800px]   mx-auto">
      <div className="text-xl  text-white">What is ENSPro?</div>
      <div className=" text-neutral-300  bg-neutral-900 bg-opacity-50">
        Imagine a place where you can organize all your ETH addresses by
        labeling them with subnames. ENSPro lets you add, edit, and remove
        subnames on all of your addresses with{" "}
        <span className="font-bold">0 gas fees</span>.
      </div>
      <div className="text-xl  text-white">New Here?</div>
      <div className=" text-neutral-300  bg-neutral-900 bg-opacity-50 mb-4">
        To assign gasless subnames to your addresses,{" "}
        <span className="font-bold">
          you will need to switch your name's resolver.
        </span>
        &nbsp;We will walk you through this when you connect.{" "}
      </div>
    </div>
  );
}
