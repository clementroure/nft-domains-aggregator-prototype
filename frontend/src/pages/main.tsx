import { useEffect, useRef, useState } from "react";
import { checkAllUD, registrarUD } from "../methods/checkUD";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import icon from "../assets/icon.png"
import { CSVLink } from "react-csv";
import Grid from "react-loading-icons/dist/esm/components/grid";
import { ethers } from "ethers";
import {contractAddress as contractAddressENS} from "../contracts/ens/ens_registrar_controller"
import {contractABI as contractABIens} from "../contracts/ens/ens_registrar_controller"
import { getFingerprint } from "react-fingerprint";
import { CheckENS, getENSgasPrice } from "../methods/checkENS";
import { Elements } from "@stripe/react-stripe-js";
import {loadStripe, Stripe} from '@stripe/stripe-js';
import CheckoutForm from "../stripe/checkoutForm";
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

    const buy =async (index: number) => {

      const domain = results[index];
      const myAddress = await signer.getAddress();
      const { chainId } = await provider.getNetwork();

      // check if on polygon network. if not switch
      if(domain.blockchain == "Polygon" && chainId != 137){
        try{
          switchToPolygon();
        }
        catch(e){
          // try by adding the network to wallet
          AddPolygonNetwork();
          switchToPolygon();
        }
        return;
      }
      // check if on ethereum network
      if(domain.blockchain == "Ethereum" && chainId != 1){
        switchToEthereum();
        return;
      }
      // get MATIC and ETH price
      await fetch(domain.blockchain == "Polygon" ? `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=MATIC` : `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=ETH`)
      .then((res) => res.json())
      .then((data) => {
         const amount = domain.blockchain == "Polygon" ? (data.MATIC * domain.price) : (data.ETH * domain.price);
         const unit = domain.blockchain == "Polygon" ? "MATIC" : "ETH";
         // cehck if balance > domain price
         provider.getBalance(myAddress).then(async (balance) => {
          // convert a currency unit from wei to ether
          const balanceInEth = ethers.utils.formatEther(balance)
          // if(domain.price == domain.renewalPrice){
          //   await getENSgasPrice(results, setResults, index);
          // }
          if(parseFloat(balanceInEth) <= amount){
            alert("Insufficient Fund: Price is " + (domain.blockchain == "Polygon" ? amount.toFixed(2).toString() : amount.toFixed(4).toString())  + " " + unit);
            return;
          }
          //// REGISTRATION ////

          // ENS: https://docs.ens.domains/dapp-developer-guide/registering-and-renewing-names (smart contract call) (testnet: Goerli, same address)
          if(domain.provider == "ENS"){

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

            register(domain.name, myAddress, 31536000); // 1 year
          }
          // UD: Partner API: https://docs.unstoppabledomains.com/openapi/reference/#operation/PostOrders (api call)
          else{
            // get entropy from browsers settings 
            // verify its the same user
            const fingerprint = await getFingerprint()

            registrarUD(domain, myAddress, email, fingerprint)
          }
        });
      });
    }

    const switchToEthereum = async() => {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      });
    }
    const switchToPolygon = async () => {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        // chainId must be in HEX with 0x in front: 137 -> 0x89
        params: [{ chainId: '0x89' }],
      });
    }
    const AddPolygonNetwork = async() => {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
            chainId: "0x89",
            rpcUrls: ["https://rpc-mainnet.matic.network/"],
            chainName: "Matic Mainnet",
            nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18
            },
            blockExplorerUrls: ["https://polygonscan.com/"]
          }]
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
      if(stripePopupRef.current && stripePopupVisible && !stripePopupRef.current.contains(e.target) && e.target.id == 'quit' && e.target.tagName.toLowerCase() != 'button'){
        setStripePopupVisible(false)
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
        if(stripePopupVisible){
          closeStripePopup(e);
        }
    }

 return (
  <div className='grid place-items-center'>
    <nav className="px-2 rounded-b-lg sm:px-4 h-16 py-2.5 bg-gray-900 fixed w-full top-0 left-0 border-b border-gray-700  bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-80">
      <div className="container flex flex-wrap items-center justify-between mx-auto relative">

          <p className="text-gray-50 mt-1 mb-6 text-xl italic font-semibold">NFT Domains</p>

          <button onClick={() => setIsSettingsVisible(!isSettingsVisible)} className="hidden 2xl:inline-flex text-gray-50 mb-4 ml-24 -mr-20 items-center bottom-2.5 bg-gray-900 border-0 border-gray-800 bg-opacity-0 hover:bg-gray-800 hover:bg-opacity-40 font-medium rounded-lg text-sm px-4 py-2" type="button">Settings<svg className="ml-2 w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></button>
          {isSettingsVisible &&
          <div ref={settingsRef} className="hidden 2xl:block absolute translate-x-56 mt-40 z-10 w-40 bg-gray-900 border-0 border-gray-800 hover:bg-gray-800 hover:bg-opacity-80 font-medium rounded-lg bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-80">
              <ul className="p-3 space-y-2 text-sm text-gray-200" aria-labelledby="dropdownCheckboxButton">
                <li>
                  <div className="flex items-center">
                    <input onChange={(e) => {setSearchMetadata(e.target.checked);}} type="checkbox" checked={searchMetadata} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-0 bg-gray-600 border-gray-500"/>
                    <label className="ml-2 text-sm font-medium text-gray-50">Get metadata</label>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <input onChange={(e) => {setSearchForENS(e.target.checked);}} type="checkbox" checked={searchForENS} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-0 bg-gray-600 border-gray-500"/>
                    <label className="ml-2 text-sm font-medium text-gray-50">ENS domains</label>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <input onChange={(e) => {setSearchForUD(e.target.checked);}} type="checkbox" checked={searchForUD} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-0 bg-gray-600 border-gray-500"/>
                    <label className="ml-2 text-sm font-medium text-gray-50">UD domains</label>
                  </div>
                </li>
              </ul>
          </div>
          }

          <div className="w-6/12 sm:w-4/12 mx-auto"> 
              <label className="mb-2 text-sm font-medium sr-only text-white">Search</label>
              <div className="relative ">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg aria-hidden="true" className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <form>
                    <input value={domainInput} onChange={(e) => setDomainInput(e.target.value)} minLength={1} maxLength={1000} type="search" id="default-search" className="-mt-4 pr-[90px] block w-full p-4 pl-10 text-sm rounded-lg bg-gray-900 border-gray-800 placeholder-gray-200 text-white focus:ring-blue-500  bg-opacity-10" placeholder="Search Domain Name..." required/>
                    <button onClick={(e) => searchDomain(e)} type="submit" className="text-white absolute right-2.5 bottom-2.5 bg-gray-900 border-0 border-gray-800 bg-opacity-0 hover:bg-gray-800 hover:bg-opacity-40 font-medium rounded-lg text-sm px-4 py-2 ">Search</button>
                  </form>
              </div>  
          </div>
          
          <div className="mb-3.5 invisible lg:visible">
            <ConnectButton />
          </div>

      </div>
    </nav>

    {stripePopupVisible &&
    <div id="quit" className="h-full w-full absolute backdrop-blur-sm z-10">
        <div ref={stripePopupRef} className="w-full max-w-md p-4 m-auto rounded-md mt-48 lg:mt-60 shadow-md bg-gray-800">
          <Elements stripe={stripePromise} options={{clientSecret, appearance: {theme: "night", labels: 'floating', variables: {colorPrimary: "#141414"}}}}>
            <CheckoutForm />
          </Elements>
        </div>
    </div>
    }

    {!isLoading ?
      <>
      {hasResults ?

        <div className="container mx-auto lg:overflow-x-hidden mt-14">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full pl-4">
              <div className="max-w-full overflow-x">
                <table className="w-full table-auto overflow-x-scroll">
                  <thead>
                    <tr className="bg-primary text-center">
                      <th
                        className="w-1/8 border-l border-transparent py-4 px-0 text-lg font-semibold text-white lg:py-7 lg:px-0"
                      >
                        TLD
                      </th>
                      <th
                        className="w-1/8 py-4 px-0 text-lg font-semibold text-white lg:py-7 lg:px-0"
                      >
                        Provider
                      </th>
                      <th
                        className="w-1/8 py-4 px-0 text-lg font-semibold text-white lg:py-7 lg:px-0"
                      >
                        Blockchain
                      </th>
                      <th
                        className="w-1/8 py-4 px-0 text-lg font-semibold text-white lg:py-7 lg:px-0"
                      >
                        Start
                      </th>
                      <th
                        className="w-1/8 py-4 px-0 text-lg font-semibold text-white lg:py-7 lg:px-0"
                      >
                        Expiration
                      </th>
                      <th
                        className="w-1/8 py-4 px-3 text-lg font-semibold text-white lg:py-7 lg:px-4"
                      >
                        Price
                      </th>
                      <th
                        className="w-1/8 py-4 px-3 text-lg font-semibold text-white lg:py-7 lg:px-4"
                      >
                        Renewal
                      </th>
                      <th
                        className="w-1/8 border-r border-transparent py-4 px-3 text-lg font-semibold text-white lg:py-7 lg:px-4"
                      >
                        Register
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                      {results.map((res: any, index: number) => (
                      <tr  key={index}>
                          <td
                              className="text-dark border-b border-l border-[#E8E8E8] bg-[#F3F6FF] py-5 px-2 text-center text-base font-medium"
                          >
                              {res.name + res.extension}
                          </td>
                          <td
                              className="text-dark border-b border-l border-[#E8E8E8] bg-white py-5 px-2 text-center text-base font-medium"
                          >
                              {res.provider}
                          </td>
                          <td
                              className="text-dark border-b border-l border-[#E8E8E8] bg-[#F3F6FF] py-5 px-2 text-center text-base font-medium"
                          >
                              {res.blockchain}
                          </td>
                          <td
                              className="text-dark border-b border-[#E8E8E8] bg-white py-5 px-2 text-center text-base font-medium"
                          >
                              {(res.provider != "UD" && res.startDate.getDay() != res.endDate.getDay()) ? res.startDate.toLocaleDateString("fr") : "/"}
                          </td>
                          <td
                              className="text-dark border-b border-[#E8E8E8] bg-[#F3F6FF] py-5 px-2 text-center text-base font-medium"
                          >
                              {(res.provider != "UD" && res.startDate.getDay() != res.endDate.getDay()) ? res.endDate.toLocaleDateString("fr") : "/"}
                          </td>
                          <td
                              className="text-dark border-b border-[#E8E8E8] bg-white py-5 px-2 text-center text-base font-medium"
                          >         
                              {resultsUI[index].isLoading == false ?
                                <>
                                {res.price != res.renewalPrice ?
                                <>       
                                  {res.available ? ( res.provider == "ENS" ? ("$"+res.price.toFixed(2).toString()) : ("$"+res.price.toString()) ): "/"}
                                </>        
                                :
                                <div>
                                  {res.available ? ( res.provider == "ENS" ? ("$"+res.price.toFixed(2).toString()) : ("$"+res.price.toString()) )
                                  : "/"
                                  }
                                  {res.available &&
                                  <>
                                  &nbsp;+&nbsp;
                                  <a onClick={async () => { 
                                    setResultsUI((_resultsUI:any)=> _resultsUI.map((_resultUI:any, i:number) => i === index ? {isLoading: true} : _resultUI));
                                    await getENSgasPrice(results, setResults, index, resultsUI, setResultsUI);
                                  }} 
                                  className="cursor-pointer underline">Fees
                                  </a>
                                  </>
                                  }
                                </div>
                                }
                                </>
                            :
                            <svg aria-hidden="true" className="w-6 h-6 animate-spin text-gray-900 fill-blue-600 mx-auto" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                            }
                          </td>
                          <td
                              className="text-dark border-b border-[#E8E8E8] bg-[#F3F6FF] py-5 px-2 text-center text-base font-medium"
                          >
                              {res.provider == "ENS" ? 
                              <>
                              {resultsUI[index].isLoading == false ?
                              ("$"+res.renewalPrice.toFixed(2).toString()) 
                              :
                              <svg aria-hidden="true" className="w-6 h-6 animate-spin text-gray-900 fill-blue-600 mx-auto" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                              </svg>
                              }
                              </>
                              : 
                              "/"
                              }
                          </td>
                          <td
                              className="text-dark border-b border-r border-[#E8E8E8] bg-white py-5 px-2 text-center text-base font-medium"
                          >
                              {res.available ?
                              <a
                              onClick={() => buy(index)}
                              className="cursor-pointer border-primary text-primary hover:bg-primary inline-block rounded border py-2 px-6 hover:border-gray-900"
                              >
                              Buy
                              </a>
                              :
                              <>
                              {res.metadata != "" ?
                              <>
                              {res.extension != ".zil" ?
                              <a href={res.metadata} target="_blank" className="cursor-pointer hover:underline">
                              Taken
                              </a>
                              :
                              <>
                              Taken
                              </>
                              }
                              </>
                              :
                              <>
                              {searchMetadata ? "Protected" : "Taken"}
                              </>
                              }
                              </>
                              }
                          </td>
                      </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* <div className="h-8"/> */}
          <CSVLink data={results} separator={";"} filename={domainInput}
            className="fixed z-50 bottom-4 left-4 bg-gray-900 w-10 h-10 rounded-full drop-shadow-lg flex justify-center items-center text-white text-3xl hover:bg-gray-800 opacity-80 hover:drop-shadow-2xl hover:animate-bounce duration-300">&#8659;
          </CSVLink>
        </div>
        :
        <>
        <div className="mt-48">
          <img className="h-80 opacity-20 pointer-events-none" src={icon}/>
        </div>
        {/* <button onClick={AlchemyMonitoring}>Monitor</button> */}
        </>
      }
      </>
    :
    <div className="relative grid h-screen place-items-center opacity-80">
      <Grid color="#F9F9F9" speed={1.5} strokeWidth={1} width={150}/>
    </div>
    }
  </div>
  );
}

export default Main;