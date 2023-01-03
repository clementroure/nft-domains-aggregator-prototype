import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./pages/main";
import Error404 from "./pages/Error404";

// call TheGraph ENS endpoint
const client = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
  cache: new InMemoryCache()
});

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
