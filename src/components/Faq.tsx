export default function Faq() {
  return (
    <div className="flex gap-4 flex-col w-full max-w-[800px]   mx-auto">
      <div className="text-xl  text-white">What is ENSPro?</div>
      <div className=" text-neutral-300  bg-neutral-900 bg-opacity-50">
      Imagine a place where you can organize all your ETH addresses by labeling them with subnames. ENSPro lets you add, edit, and remove subnames on all of your addresses with{" "}
        <span className="font-bold">0 gas fees.</span>
        </div>
  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src="https://www.youtube.com/embed/lb3rrGwjmig"
          allowFullScreen
          frameBorder="0"
        ></iframe>
      </div>
      <div className="text-xl  text-white">New Here?</div>
      <div className=" text-neutral-300  bg-neutral-900 bg-opacity-50 mb-20">
        To assign gasless subnames to your addresses,{" "}
        <span className="font-bold">
          you will need to switch your name's resolver.
        </span>
        &nbsp;We will walk you through this when you connect.{" "}
      </div>
    </div>
 
  );
}
