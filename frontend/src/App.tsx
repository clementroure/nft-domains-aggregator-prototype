import React, { useState } from "react";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  connectorsForWallets,
  RainbowKitProvider,
  Theme,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  omniWallet,
  argentWallet,
  imTokenWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
  configureChains,
  createClient,
  WagmiConfig,
} from "wagmi";
import { mainnet, polygon} from 'wagmi/chains'
import merge from 'lodash.merge';
import { publicProvider } from 'wagmi/providers/public';
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./pages/main";
import Error404 from "./pages/Error404";
// Wallet theme
const myDarkTheme = merge(darkTheme(), {
  colors: {
    connectButtonBackground: 'rgba(52, 52, 52, 0)',
    modalText: localStorage.getItem("theme") == "dark" ? '#fbfbfc' : '#282c31',
    accentColor: '#2591b7',
    connectButtonText: '#cbd5e1',
    connectButtonBackgroundError: '#a40000',
  },
} as Theme);
const myLightTheme = merge(lightTheme(), {
  colors: {
     
  },
} as Theme);
// Blockchains used
const { chains, provider } = configureChains(
  [mainnet, polygon],
  [
    publicProvider()
  ]
);
// Wallets supported
const connectors = connectorsForWallets([
  {
    groupName: 'Popular',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ chains }),
      coinbaseWallet({ chains, appName: 'Blockchain Domains' }),
      walletConnectWallet({ chains }),
    ],
  },
  {
    groupName: 'Others',
    wallets: [
      trustWallet({ chains }),
      argentWallet({ chains }),
      omniWallet({ chains }),
      imTokenWallet({ chains }),
      ledgerWallet({ chains }),
    ],
  },
]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})
// call TheGraph ENS endpoint
const client = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
  cache: new InMemoryCache()
});

function App() {
  return (
    <ApolloProvider client={client}>
        <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider chains={chains} theme={lightTheme()}>
              <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Main />}/>
                    <Route path="*" element={<Error404 />}/>
                  </Routes>
              </BrowserRouter>
            </RainbowKitProvider>
        </WagmiConfig>
      </ApolloProvider>
  );
}

export default App;
