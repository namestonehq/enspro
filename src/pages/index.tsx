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
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  return {
    props: {
      session: await getServerSession(req, res, getAuthOptions(req)),
    },
  };
};

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

const Home: NextPage = (props) => {
  const [selectedName, setSelectedName] = useState("");
  const [names, setNames] = useState<Name[]>([]);
  const { address, isConnected } = useAccount();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  const handleSelectName = (name: string) => {
    setSelectedName(name);
  };
  // Manage 'authenticated' as a state

  const authenticated = session?.address ? true : false;
  console.log("USER", session, address, isConnected);

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

    if (address && authenticated) {
      fetchNames();
    }
  }, [address, authenticated]);

  return (
    <div className="bg-grid bg-neutral-900 -z-20">
      {/* Nav Bar */}
      <NavBar />
      <main className="flex min-h-screen flex-col px-2 sm:px-8 max-w-5xl mx-auto">
        {/* Main Content */}
        <div className="flex  flex-col">
          {/* Box */}
          {address && authenticated ? (
            <div className="flex mt-8 shadow-lg w-full max-w-[800px] min-h-[480px] pb-0 p-8 flex-col  bg-neutral-800   rounded mx-auto">
              <div className="flex justify-between">
                <div className="mb-4 text-lg font-bold text-white">
                  Select a Name
                </div>
              </div>
              {loading ? (
                <div className="flex flex-col  justify-center items-center flex-1">
                  <Image
                    src="/loading-spinner.svg"
                    alt="spinner"
                    className="mr-2 text-white"
                    width={32}
                    height={32}
                  />
                  <div className=" text-neutral-300 mt-4">Loading names...</div>
                </div>
              ) : (
                <NameTable
                  names={names}
                  selectedName={selectedName}
                  onSelectName={handleSelectName}
                />
              )}
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
              <div className="text-3xl  text-white font-bold mt-4 mb-2">
                Welcome to ENS<span className=" text-emerald-500">PRO</span>
              </div>
              <div className="  text-neutral-300 mb-4">
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

export default Home;
