import "../styles/global.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import {
  RainbowKitSiweNextAuthProvider,
  GetSiweMessageOptions,
} from "@rainbow-me/rainbowkit-siwe-next-auth";
import { Toaster } from "react-hot-toast";
import { config } from "../lib/config";

const getSiweMessageOptions: GetSiweMessageOptions = () => ({
  statement: "Sign in to ENSPro",
});
import Head from "next/head";

const queryClient = new QueryClient();

export default function App({
  Component,
  pageProps,
}: AppProps<{
  session: Session;
}>) {
  return (
    <>
      <Head>
        <meta
          property="og:image"
          content="https://enspro.xyz/opengraph-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:title" content="ENSPro" />
        <meta
          property="og:description"
          content="Your Personal Subname Manager"
        />
      </Head>
      <SessionProvider refetchInterval={0} session={pageProps.session}>
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            // Define default options
            duration: 3000,
            style: {
              background: "#404040",
              color: "#34D399",
            },
          }}
        />
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitSiweNextAuthProvider
              getSiweMessageOptions={getSiweMessageOptions}
            >
              <RainbowKitProvider
                theme={darkTheme({
                  accentColor: "#0E76FD",
                  accentColorForeground: "white",
                  borderRadius: "large",
                  fontStack: "system",
                  overlayBlur: "small",
                })}
              >
                <Component {...pageProps} />
              </RainbowKitProvider>
            </RainbowKitSiweNextAuthProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </SessionProvider>
    </>
  );
}
