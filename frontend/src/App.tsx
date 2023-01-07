import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { FpjsProvider } from '@fingerprintjs/fingerprintjs-pro-react';
import Main from "./pages/main";
import Error404 from "./pages/Error404";

// call TheGraph ENS endpoint
const client = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
  cache: new InMemoryCache()
});

function App() {
  return (
      <FpjsProvider
        loadOptions={{
          apiKey: "dXbE2aGdHysk2rElrKlG",
          region: "eu"
        }}
      >
        <ApolloProvider client={client}>
          <BrowserRouter>
            <Routes>
                <Route path="/" element={<Main />}/>
                <Route path="*" element={<Error404 />}/>
              </Routes>
          </BrowserRouter>
        </ApolloProvider>
      </FpjsProvider>
  );
}

export default App;
