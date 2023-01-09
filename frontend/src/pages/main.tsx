import { useEffect, useRef, useState } from "react";
import { checkAllUD, registrarUD } from "../methods/api/checkUD";
import icon from "../assets/icon.png"
import { CSVLink } from "react-csv";
import Grid from "react-loading-icons/dist/esm/components/grid";
import { ethers } from "ethers";
import {contractAddress as contractAddressENS} from "../contracts/ens/ens_registrar_controller"
import {contractABI as contractABIens} from "../contracts/ens/ens_registrar_controller"
import { getFingerprint } from "react-fingerprint";
import { CheckENS} from "../methods/api/checkENS";
import {loadStripe, Stripe} from '@stripe/stripe-js';
import { StripePopup } from "../widgets/popups/StripePopup";
import { PaymentSelectionPopup } from "../widgets/popups/PaymentSelectionPopup";
import { Table } from "../widgets/Table";
import { Navbar } from "../widgets/navbar";
import { switchToEthereum, switchToPolygon, addPolygonNetwork } from "../methods/switchBlockchain";
// stripe (test values)
const clientSecret = "pi_3LXLRHFuKXi25RGc1OPGpaWZ_secret_3xOxozTIOqr60uECWEkp5w7BF"
const stripePromise = loadStripe(`${process.env.REACT_APP_STRIPE_KEY}`);
// eth
const ethereum = window.ethereum;

function Main(){

    // check if new search input is different than last one
    const [oldDomainInput, setOldDomainInput] = useState("")
    // search input
    const [domainInput, setDomainInput] = useState("")
    // 1 result obj = 1 line
    const [results, setResults] = useState<{name: string, extension: string, available: boolean, provider: string, blockchain: string, price: number, renewalPrice: number, startDate: Date, endDate: Date, metadata: string}[]>([])
    // just to update the UI
    const [resultsUI, setResultsUI] = useState<{isLoading: boolean}[]>([])
    // check if display table
    const [hasResults, setHasResults] = useState(false)
    // loadings
    const [isLoading, setIsLoading] = useState(false)
    const [isUDloading, setIsUDloading] = useState(false)
    const [isENSloading, setIsENSloading] = useState(false)
    // settings
    const [searchMetadata, setSearchMetadata] = useState(true) // increase loading time
    const [searchForUD, setSearchForUD] = useState(true)
    const [searchForENS, setSearchForENS] = useState(true)
    // variabless for ENS subgraph queries
    const [ENSdomainInput, setENSdomainInput] = useState("")
    const [ENSlabelHash, setENSlabelHash] = useState("")
    // user email
    const [email, setEmail] = useState("clementroure@orange.fr")

    // Get wallet
    const provider = new ethers.providers.Web3Provider(ethereum,'any');
    const signer = provider.getSigner();
    // ENS smartcontract to register a new domain
    const ensController = new ethers.Contract(contractAddressENS, contractABIens, signer); 

    // Get ENS domain infos
    // Called automatically each time var ENSdomainInput is refreshed
    CheckENS(ENSdomainInput, ensController, isLoading, hasResults, setENSlabelHash, setIsENSloading, setResults, ENSlabelHash, provider);

    // check if wallet connected on startup
    // useEffect(() => {
    //   const test = async () => {
    //     await ethereum.request({ method: 'eth_requestAccounts' })
    //   }
    //   test();
    // },[])

    const searchDomain = async (e:any) => {
      
      // format input
      const formattedDomainInput = (domainInput.replace(/,(\s+)?$/, '')).replace(/\s+/g, "");
      setDomainInput(formattedDomainInput)
      // separate multiple domains
      var domainList = (formattedDomainInput).split(",").map(function(item) {
        return item.trim();
      });
      // test if each domain doesnt contain special chars
      if(domainList[0].match(/^ *$/) !== null) { return; } else{ e.preventDefault(); }
      const regex = new RegExp("^[A-Za-z0-9]+[a-zA-Z0-9-]*$")
      for(let i=0; i<domainList.length;i++){
        if(!regex.test(domainList[i])){
          alert("Error: The search input contains invalid characters.")
          return;
        }
      }
      // check if wallet connected
      await signer.getAddress().then(() => {

        // get domains infos
        if(domainList[0] != oldDomainInput){
          setOldDomainInput(domainList[0])
          if(!searchForUD && !searchForENS){
            alert("Error: Both ENS and UD domains are disabled.");
            return;
          }
          if(searchForUD || searchForENS){
            setIsLoading(true);
            setResults([]);
          }
          if(searchForUD){
            setIsUDloading(true);
          }
          if(searchForENS){
            setIsENSloading(true);
          }
          // if several domains
          for(let i=0; i<domainList.length;i++){

            if(searchForUD){
              checkAllUD(domainList[i], setResults, searchMetadata, setIsUDloading);
            }

            if(searchForENS){
              if(domainList[i].length >= 3){ // min 3 char for ENS domain
                setENSdomainInput(domainList[i]+".eth");
              }
              else{
                setIsENSloading(false);
              }
            }
          }
        }
      })
      .catch(() => { alert("Error: Connect your wallet."); });
    }

    const [chainId_buying, setChainId_buying] = useState(0);
    const [domain_buying, setDomain_buying] = useState<{name: string, extension: string, available: boolean, provider: string, blockchain: string, price: number, renewalPrice: number, startDate: Date, endDate: Date, metadata: string}>()
    const buyBtn = async (index: number) => {

      const domain = results[index];
      setDomain_buying(domain);

      const { chainId } = await provider.getNetwork();
      setChainId_buying(chainId);

      if(domain.provider == "ENS"){
        buyCrypto();
      }
      else{
        setPaymentSelectionPopupVisible(true);
      }
    }

    const buyCrypto =async () => {

      const myAddress = await signer.getAddress();

      // check if on polygon network. if not switch
      if(domain_buying?.blockchain! == "Polygon" && chainId_buying != 137){
        try{
          switchToPolygon(ethereum, setChainId_buying);
        }
        catch(e){
          // try by adding the network to wallet
          addPolygonNetwork(ethereum);
          switchToPolygon(ethereum, setChainId_buying);
        }
        return;
      }
      // check if on ethereum network
      if(domain_buying!.blockchain == "Ethereum" && chainId_buying != 1){
        switchToEthereum(ethereum, setChainId_buying);
        return;
      }
      // get MATIC and ETH price
      await fetch(domain_buying?.blockchain == "Polygon" ? `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=MATIC` : `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=ETH`)
      .then((res) => res.json())
      .then((data) => {
         const amount = domain_buying?.blockchain == "Polygon" ? (data.MATIC * domain_buying?.price) : (data.ETH * domain_buying?.price!);
         const unit = domain_buying?.blockchain == "Polygon" ? "MATIC" : "ETH";
         // cehck if balance > domain price
         provider.getBalance(myAddress).then(async (balance) => {
          // convert a currency unit from wei to ether
          const balanceInEth = ethers.utils.formatEther(balance)
          // if(domain.price == domain.renewalPrice){
          //   await getENSgasPrice(results, setResults, index);
          // }
          if(parseFloat(balanceInEth) <= amount){
            alert("Insufficient Fund: Price is " + (domain_buying?.blockchain == "Polygon" ? amount.toFixed(2).toString() : amount.toFixed(4).toString())  + " " + unit);
            return;
          }
          //// REGISTRATION ////

          // ENS: https://docs.ens.domains/dapp-developer-guide/registering-and-renewing-names (smart contract call) (testnet: Goerli, same address)
          if(domain_buying?.provider == "ENS"){

            const controller = new ethers.Contract(contractAddressENS, contractABIens, signer); 
            const register = async (name: string, owner:any, duration:any) => {
              // Generate a random value to mask our commitment
              const random = new Uint8Array(32);
              crypto.getRandomValues(random);
              const salt = "0x" + Array.from(random).map(b => b.toString(16).padStart(2, "0")).join("");
              // Submit our commitment to the smart contract
              const commitment = await controller.makeCommitment(name, owner, salt);
              console.log(commitment)
              const tx = await controller.commit(commitment);
              console.log(tx)
              // Add 10% to account for price fluctuation; the difference is refunded.
              const price = Math.round((await controller.rentPrice(name, duration)) * 1.1);
              console.log(price)
              // Wait 60 seconds before registering
              setTimeout(async () => {
                // Submit our registration request
                try{
                  await controller.register(name, owner, duration, salt, {value: price});
                }
                catch(e){console.log(e)}
              }, 60000);
            }

            register(domain_buying?.name, myAddress, 31536000); // 1 year
          }
          // UD: Partner API: https://docs.unstoppabledomains.com/openapi/reference/#operation/PostOrders (api call)
          else{
            // get entropy from browsers settings 
            // verify its the same user
            const fingerprint = await getFingerprint()

            registrarUD(domain_buying, myAddress, email, fingerprint)
          }
        });
      });
    }

    // called when ud or ens data ahs been loaded
    const [ignoreFirst, setIgnoreFirst] = useState(true)
    useEffect(() => {
    if(ignoreFirst){setIgnoreFirst(false); return;}
        if(searchForENS && searchForUD){
          if(results.length > 1){ // more than ENS result only
            if(!isENSloading && !isUDloading){

              // Sort results (optional)
              // setResults(data => {
              //   const dataToSort = [...data];
              //   dataToSort.sort(function (a, b) {
              //     if (a.name < b.name) {
              //       return -1;
              //     }
              //     if (a.name > b.name) {
              //       return 1;
              //     }
              //     return 0;
              //   });
              //   return dataToSort; // <-- now sorted ascending
              // })
              
              let _resultsUI: {isLoading: boolean}[] = []
              for(let i=0; i<results.length;i++){
                _resultsUI.push({isLoading: false})
              }
              setResultsUI(_resultsUI)

              setHasResults(true)
              setIsLoading(false)
              //console.log(results)
            }
          }
        }
        if(searchForENS && !searchForUD){
          if(!isENSloading){
            let _resultsUI: {isLoading: boolean}[] = []
            for(let i=0; i<results.length;i++){
              _resultsUI.push({isLoading: false})
            }
            setResultsUI(_resultsUI)

            setIsLoading(false)
            setHasResults(true)
          }
        }
        if(!searchForENS && searchForUD){
          if(!isUDloading){
            let _resultsUI: {isLoading: boolean}[] = []
            for(let i=0; i<results.length;i++){
              _resultsUI.push({isLoading: false})
            }
            setResultsUI(_resultsUI)

            setIsLoading(false)
            setHasResults(true)
          }
        }
    },[results])

    const [stripePopupVisible, setStripePopupVisible] = useState(false)
    const stripePopupRef = useRef<HTMLDivElement>(null)
    const closeStripePopup = (e:any)=>{
      if(e.target.id == 'quit' && e.target.tagName.toLowerCase() != 'button'){
        setStripePopupVisible(false)
      }
     }
     const [paymentSelectionPopupVisible, setPaymentSelectionPopupVisible] = useState(false)
     const paymentSelectionPopupRef = useRef<HTMLDivElement>(null)
     const closePaymentSelectionPopup = (e:any)=>{
       if(e.target.id == 'quit' && e.target.tagName.toLowerCase() != 'button'){
         setPaymentSelectionPopupVisible(false)
       }
      }

    const [isSettingsVisible, setIsSettingsVisible] = useState(false)
    // Settings popup visibility handler
    const settingsRef = useRef<HTMLInputElement>(null);
     // Detect user click
     useEffect(() => {
      document.addEventListener("click", handleClickOutside, true)
    },[]);
    const handleClickOutside = (e:any) => {
        if(!settingsRef.current?.contains(e.target)){
            // click outside button
            setIsSettingsVisible(false)
        }
        if(!stripePopupRef.current?.contains(e.target)){
          closeStripePopup(e);
        }
        if(!paymentSelectionPopupRef.current?.contains(e.target)){
          closePaymentSelectionPopup(e);
        }
    }

 return (
  <>
  {stripePopupVisible &&
   <StripePopup stripePopupRef={stripePopupRef} stripePromise={stripePromise} clientSecret={clientSecret}/>
  }

  {paymentSelectionPopupVisible && 
   <PaymentSelectionPopup paymentSelectionPopupRef={paymentSelectionPopupRef} buyCrypto={buyCrypto} setPaymentSelectionPopupVisible={setPaymentSelectionPopupVisible} 
   setStripePopupVisible={setStripePopupVisible} domain_buying={domain_buying}/>
  }

  <div className='grid place-items-center'>
    <Navbar isSettingsVisible={isSettingsVisible} setIsSettingsVisible={setIsSettingsVisible} settingsRef={settingsRef} 
    searchMetadata={searchMetadata} setSearchMetadata={setSearchMetadata} searchDomain={searchDomain} domainInput={domainInput} 
    setDomainInput={setDomainInput} searchForUD={searchForUD} setSearchForUD={setSearchForUD} searchForENS={searchForENS} 
    setSearchForENS={setSearchForENS}/>

    {!isLoading ?
      <>
      {hasResults ?

        <div className="container mx-auto lg:overflow-x-hidden mt-14">
          <Table results={results} setResults={setResults} resultsUI={resultsUI} setResultsUI={setResultsUI} searchMetadata={searchMetadata} 
          buyBtn={buyBtn}/>

          <CSVLink data={results} separator={";"} filename={domainInput}
            className="fixed z-50 bottom-4 left-4 bg-gray-900 w-10 h-10 rounded-full drop-shadow-lg flex justify-center items-center text-white text-3xl hover:bg-gray-800 opacity-80 hover:drop-shadow-2xl hover:animate-bounce duration-300">&#8659;
          </CSVLink>
        </div>
        :
        <>
        <div className="mt-48">
          <img className="h-80 opacity-20 pointer-events-none" src={icon}/>
        </div>
        </>
      }
      </>
    :
    <div className="relative grid h-screen place-items-center opacity-80">
      <Grid color="#F9F9F9" speed={1.5} strokeWidth={1} width={150}/>
    </div>
    }
  </div>

  </>
  );
}

export default Main;