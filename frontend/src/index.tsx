import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
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
import App from './App';
// init react app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Wallet theme
const myDarkTheme = merge(darkTheme(), {
  colors: {
    connectButtonBackground: 'rgba(52, 52, 52, 0)',
    // accentColor: '#2591b7',
    // connectButtonText: '#cbd5e1',
    connectButtonBackgroundError: '#a40000',
  },
} as Theme);
const myLightTheme = merge(lightTheme(), {
  colors: {
    connectButtonBackground: 'rgba(52, 52, 52, 0)',
    connectButtonBackgroundError: '#a40000',
    connectButtonText: 'rgba(255, 255, 255, 255)',
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

root.render(
  <WagmiConfig client={wagmiClient}>
    <RainbowKitProvider chains={chains} theme={myDarkTheme}>
      <App />
    </RainbowKitProvider>
  </WagmiConfig>
);

reportWebVitals();
