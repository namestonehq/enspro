import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "./api/auth/[...nextauth]";
import { Button } from "../components/ui/button";
import NavBar from "../components/nav-bar";
import NameTable from "../components/NameTable";
import Faq from "../components/Faq";
import Footer from "../components/Footer";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Input } from "../components/ui/input";
type Name = {
  name: string;
  resolver?: string;
  status?: boolean;
  parentName?: string;
  owner?: Address;
  resolvedAddress?: Address;
  createdAt?: {
    date: string;
    value: number;
  };
  expiryDate?: {
    date: string;
    value: number;
  };
};

const Home: NextPage = () => {
  const [selectedName, setSelectedName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [names, setNames] = useState<Name[]>([]);
  const [displayNames, setDisplayNames] = useState<Name[]>([]);
  const { address, chain } = useAccount();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  const handleSelectName = (name: string) => {
    setSelectedName(name);
  };
  // Manage 'authenticated' as a state

  const authenticated = session?.address === address ? true : false;

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await fetch(`/api/get-names?address=${address}`);
        setLoading(false);
        if (response.ok) {
          const displayedData = await response.json();
          console.log(displayedData);
          setNames(displayedData);
        } else {
          console.error("Failed to fetch names");
        }
      } catch (error) {
        console.error("Error fetching names:", error);
      }
    };

    if (address && authenticated && chain) {
      fetchNames();
    }
  }, [address, authenticated, chain]);

  //useEffect for search
  useEffect(() => {
    const filteredNames = names.filter((name) =>
      name.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setDisplayNames(filteredNames);
  }, [searchText, names]);

  return (
    <div className="bg-grid bg-fixed bg-neutral-900 -z-20">
      {/* Toaster */}
      {/* Nav Bar */}
      <NavBar />
      <main className="flex min-h-screen flex-col px-2 sm:px-8 max-w-5xl mx-auto">
        {/* Main Content */}
        <div className="flex  flex-col">
          {/* Box */}
          {address && authenticated && chain ? (
            <div className="flex mt-8 shadow-lg w-full max-w-[800px] min-h-[480px] pb-4 p-4 sm:p-8 flex-col  bg-neutral-800   rounded mx-auto">
              <div className="flex justify-between mb-4">
                <div className=" text-lg font-bold text-white">
                  {names.length === 0 ? "" : "Select a Name"}
                </div>
                {names.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Image
                        src="icon-search.svg"
                        alt="url"
                        width={12}
                        height={12}
                        className=""
                      />
                    </div>
                    <Input
                      id="url"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-[36px] bg-neutral-750 focus-visible:ring-0 text-xs text-white rounded placeholder:text-neutral-500"
                      placeholder="Search Names"
                    />
                  </div>
                )}
              </div>
              {
                loading ? (
                  <div className="flex flex-col  justify-center items-center flex-1">
                    <Image
                      src="/loading-spinner.svg"
                      alt="spinner"
                      className="mr-2 text-white"
                      width={32}
                      height={32}
                    />
                    <div className=" text-neutral-300 mt-4">
                      Loading names...
                    </div>
                  </div>
                ) : names.length === 0 ? (
                  <NoNamesFound /> // Render this component when names array is empty
                ) : (
                  <NameTable
                    names={displayNames}
                    selectedName={selectedName}
                    onSelectName={handleSelectName}
                  />
                ) // Render this component when names array is not empty
              }
            </div>
          ) : (
            <div className="flex mt-8 items-center justify-center shadow-lg  bg-neutral-800 w-full max-w-[800px] min-h-[480px] p-8 flex-col rounded mx-auto">
              <div>
                {" "}
                <Image
                  src="/enspro-icon.svg"
                  alt="Logo"
                  width={40}
                  height={40}
                />
              </div>
              <div className="text-3xl  text-white font-bold mt-4 mb-2 text-center">
                Welcome to ENS<span className=" text-emerald-500">Pro</span>
              </div>
              <div className="  text-neutral-300 mb-4  text-center">
                Your Personal Subname Manager
              </div>
            </div>
          )}
        </div>
        <div className="h-12 mx-auto my-6 border-l opacity-50 border-dashed border- bg-neutral-900"></div>
        <Faq />
      </main>
      <Footer />
    </div>
  );
};

function NoNamesFound() {
  return (
    <div className="flex gap-1 flex-col items-center text-neutral-300 flex-1 justify-center">
      <Image src="/crying-face.svg" alt="Logo" width={60} height={60} />
      <span className="text-white">No ENS names owned </span>{" "}
      <span>
        Connect another wallet or get a name at
        <Link
          target="_blank"
          className=" text-emerald-400"
          href="https://app.ens.domains/"
        >
          &nbsp;ens.domains
        </Link>
      </span>
    </div>
  );
}

export default Home;
