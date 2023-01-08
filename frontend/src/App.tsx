import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Moralis from "moralis"
import Main from "./pages/main";
import Error404 from "./pages/Error404";
import { Alchemy, Network } from "alchemy-sdk";

// call TheGraph ENS endpoint
const client = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
  cache: new InMemoryCache()
});

// Create 433 warnings in console
// Moralis.start({
//   apiKey: `${process.env.REACT_APP_MORALIS_KEY}`
// });

// Init Alchemy
const settings = {
  apiKey: `${process.env.REACT_APP_ALCHEMY_ETHEREUM_KEY}`,
  network: Network.ETH_MAINNET
}; 
new Alchemy(settings);

function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<Main />}/>
            <Route path="*" element={<Error404 />}/>
          </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
