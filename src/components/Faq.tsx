export default function Faq() {
  return (
    <div className="flex gap-4 flex-col w-full sm:w-[800px]   mx-auto">
      <div className="text-xl  text-slate-900">What is ENS One?</div>
      <div className=" text-slate-700  bg-white bg-opacity-50">
        Imagine a place where you can organize all your ETH addresses by
        labeling them with subnames. ENS One lets you add, edit, and remove
        subnames on all of your addresses with{" "}
        <span className="font-bold">0 gas fees</span>.
      </div>
      <div className="text-xl  text-slate-900">New Here?</div>
      <div className=" text-slate-700 mb bg-white bg-opacity-50 mb-4">
        To assign gasless subnames to your addresses,{" "}
        <span className="font-bold">
          you will need to switch your name’s resolver.
        </span>
        We will walk you through this when you connect, but you access our
        instructions anytime.{" "}
      </div>
    </div>
  );
}
