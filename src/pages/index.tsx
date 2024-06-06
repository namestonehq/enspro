import { ConnectButton } from "../components/connect-button";
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

const Home: NextPage = () => {
  const [selectedName, setSelectedName] = useState("");
  const [names, setNames] = useState<Name[]>([]);
  const { address } = useAccount();
  // Manage 'authenticated' as a state
  const [authenticated, setAuthenticated] = useState(true);
  const handleSelectName = (name: string) => {
    setSelectedName(name);
  };

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await fetch(`/api/get-names?address=${address}`);

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
    <div className="bg-grid -z-20">
      <div className="bg-white h-16 absolute w-full z-10"></div>
      <main className="flex min-h-screen flex-col px-2 sm:px-8 max-w-5xl mx-auto">
        {/* Nav Bar */}
        <NavBar />
        {/* Main Content */}
        <div className="flex  flex-col">
          {/* Box */}
          {address && authenticated ? (
            <div className="flex mt-8 shadow-lg w-full sm:w-[800px] min-h-[480px] p-8 flex-col bg-white border border-slate-200 rounded mx-auto">
              <div className="flex justify-between">
                <div className="mb-4">Select a Name</div>
                <div className="text-xs  text-slate-300">{selectedName}</div>
              </div>

              <NameTable
                names={names}
                selectedName={selectedName}
                onSelectName={handleSelectName}
              />
              <div className="flex-grow"></div>

              <Button disabled={selectedName == ""} className="w-32 self-end">
                {" "}
                <Link href={`/manage?name=${selectedName}`}>Manage Name</Link>
              </Button>
            </div>
          ) : (
            <div className="flex mt-8 items-center justify-center shadow-lg bg-white w-full sm:w-[800px] min-h-[480px] p-8 flex-col border border-slate-200 rounded mx-auto">
              <div>
                {" "}
                <Image src="/logo.svg" alt="Logo" width={40} height={40} />
              </div>
              <div className="text-3xl text-slate-800 font-bold mt-4 mb-2">
                Welcome to ENS/ONE
              </div>
              <div className=" text-slate-500 mb-4">
                Your Personal Subname Manager
              </div>
              <ConnectButton />
            </div>
          )}
        </div>
        <div className="h-12 mx-auto my-6 border-l opacity-50 border-dashed border-slate-800"></div>
        <Faq />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
