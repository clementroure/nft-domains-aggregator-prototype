import { useEffect, useRef, useState } from "react";
import { checkAllUD, registrarUD } from "../methods/checkUD";
import { gql, useQuery } from "@apollo/client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import icon from "../assets/icon.png"
import { CSVLink } from "react-csv";
import Grid from "react-loading-icons/dist/esm/components/grid";
import { ethers } from "ethers";
import {contractAddress as contractAddressENS} from "../contracts/ens/ens_registrar_controller"
import {contractABI as contractABIens} from "../contracts/ens/ens_registrar_controller"

// ENS queries
const myQuery1 = gql`
  query domains($domainName : String!) {
    domains(where:{name: $domainName})
    {
      labelhash
    }
  }
`;
const myQuery2 = gql`
  query domains($labelHash : String!) {
    registrations(where: {id: $labelHash}) 
    {
      registrationDate
      expiryDate
      registrant {
        id
      }
      events {
        transactionID
      }
    }
  }
`;

function Main(){

    const [oldDomainInput, setOldDomainInput] = useState("")
    const [domainInput, setDomainInput] = useState("")

    const [results, setResults] = useState<{name: string, extension: string, available: boolean, provider: string, blockchain: string, price: number, renewalPrice: number, startDate: Date, endDate: Date, metadata: string}[]>([])
    const [hasResults, setHasResults] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [isUDloading, setIsUDloading] = useState(false)
    const [isENSloading, setIsENSloading] = useState(false)
    // get metadata or not
    const [advancedSearch, setAdvancedSearch] = useState(true)

    const [ENSdomainInput, setENSdomainInput] = useState("")
    const [ENSlabelHash, setENSlabelHash] = useState("")
    // ENS call -> labelhash
    let { data, loading, error } = useQuery(myQuery1, {
        variables: {
            domainName: ENSdomainInput,
        },
      },
    );
    useEffect(() => {
      if(!hasResults && !isLoading){return;}
      const onCompleted = async (data: any) => {  
        if(JSON.stringify(data["domains"][0]) != undefined){
          // console.log("ENS - Label Hash: " + (JSON.stringify(data["domains"][0].labelhash)));
          setENSlabelHash(data["domains"][0].labelhash);
        }
        else{
          const name = ENSdomainInput.substring(0, ENSdomainInput.length-4);
          let renewal = 5;
          if(name.length == 4){
            renewal = 160;
          }
          else if(name.length == 3){
            renewal = 640;
          }
          await fetch(`https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD`)
          .then((res) => res.json())
          .then((data) => {
             const _price = renewal + parseFloat(data.USD) * 0.006;
             setResults(prevData => [{name: name, extension:".eth", provider: "ENS", blockchain: "Ethereum", startDate: new Date(), endDate: new Date(), price: _price, renewalPrice: renewal, available: true, metadata: ""}, ...prevData])
             setIsENSloading(false);
          });
        }
     };
      const onError = (error: any) => { console.log(error) };
      if (onCompleted || onError) {
        if (onCompleted && !loading && !error) {
          onCompleted(data);
        } else if (onError && !loading && error) {
          onError(error);
        }
      }
    }, [loading, data, error]);
    // ENS Call 2 -> metadata
    let { data : data2, loading : loading2, error : error2 } = useQuery(myQuery2, {
        variables: {
            labelHash: ENSlabelHash,
        },
      },
    );
    useEffect(() => {
      if(!hasResults && !isLoading){return;}
      const onCompleted = async (data: any) => {  
        //console.log(data)
         if(data.registrations.length > 0){

            const name = ENSdomainInput.substring(0, ENSdomainInput.length-4);

            var registration_date = new Date(parseInt(JSON.stringify(data.registrations[0].registrationDate).slice(1, -1)) * 1000);
            var expiry_date = new Date(parseInt(JSON.stringify(data.registrations[0].expiryDate).slice(1, -1)) * 1000);
            let ownerAddress = data.registrations[0].registrant.id;
            let transactionID = data.registrations[0].events[0].transactionID;

            let renewal = 5;
            if(name.length == 4){
              renewal = 160;
            }
            else if(name.length == 3){
              renewal = 640;
            }

            // get tokenID from domain.eth -> https://docs.ens.domains/dapp-developer-guide/ens-as-nft
            const BigNumber = ethers.BigNumber
            const utils = ethers.utils
            const labelHash = utils.keccak256(utils.toUtf8Bytes(name))
            const tokenId = BigNumber.from(labelHash).toString()

            await fetch(`https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD`)
            .then((res) => res.json())
            .then((data) => {
              const _price = renewal + parseFloat(data.USD) * 0.006;
              setResults(prevData => [{name: name, extension:".eth", provider: "ENS", blockchain: "Ethereum", startDate: registration_date, endDate: expiry_date, price: _price, renewalPrice: renewal, available: false, metadata: "https://opensea.io/fr/assets/ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/" + tokenId}, ...prevData]) // or link to etherscan tx
              setIsENSloading(false);
            });
            // console.log("Registration Date: " + registration_date.toLocaleDateString("fr"));
            // console.log("Expiry Date: " + expiry_date.toLocaleDateString("fr"));
            // console.log("Registrant address: " + (JSON.stringify(data.registrations[0].registrant.id)));
          }
      };
      const onError = (error2: any) => { console.log(error2) };
      if (onCompleted || onError) {
        if (onCompleted && !loading2 && !error2) {
          onCompleted(data2);
        } else if (onError && !loading2 && error2) {
          onError(error2);
        }
      }
    }, [loading2, data2, error2]);

    const searchDomain = () => {

        if(domainInput != oldDomainInput){
          setOldDomainInput(domainInput)
          const regex = new RegExp("^[A-Za-z0-9]+[a-zA-Z0-9_.-]*$")
          if(regex.test(domainInput)){

              setIsLoading(true);
              setIsENSloading(true);
              setIsUDloading(true);

              setResults([]);
              checkAllUD(domainInput, setResults, advancedSearch, setIsUDloading);
              if(domainInput.length >= 3){ // min 3 char ENS
                 setENSdomainInput(domainInput+".eth");
              }
              else{
                setIsENSloading(false);
              }
          }
          else{
              alert("ERROR: The search input is empty or contains invalid characters.")
          }
        }
    }

    const buy =async (index: number) => {

      const domain = results[index];
      // @ts-ignore
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const myAddress = await signer.getAddress();
      const { chainId } = await provider.getNetwork()

      if(domain.blockchain == "Polygon" && chainId != 137){
        try{
          // @ts-ignore
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x89' }], // chainId must be in HEX with 0x in front
          });
        }
        catch(e){
          // @ts-ignore
          window.ethereum.request({
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
          // @ts-ignore
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x89' }],
          });
        }
        return;
      }
      if(domain.blockchain == "Ethereum" && chainId != 1){
        // @ts-ignore
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }],
        });
        return;
      }

      await fetch(domain.blockchain == "Polygon" ? `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=MATIC` : `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=ETH`)
      .then((res) => res.json())
      .then((data) => {
         const amount = domain.blockchain == "Polygon" ? (data.MATIC * domain.price) : (data.ETH * domain.price);
         const unit = domain.blockchain == "Polygon" ? "MATIC" : "ETH";

         provider.getBalance(myAddress).then((balance) => {
          // convert a currency unit from wei to ether
          const balanceInEth = ethers.utils.formatEther(balance)
          if(parseFloat(balanceInEth) <= amount){
            alert("Insufficient Fund: Price is " + (domain.blockchain == "Polygon" ? amount.toFixed(2).toString() : amount.toFixed(4).toString())  + " " + unit);
            return;
          }
          //// REGISTRATION ////

          // ENS: https://docs.ens.domains/dapp-developer-guide/registering-and-renewing-names (smart contract call)
          if(domain.provider == "ENS"){

            const controller = new ethers.Contract(contractAddressENS, contractABIens, signer); 
            const register = async (name: string, owner:any, duration:any) => {
              // Generate a random value to mask our commitment
              const random = new Uint8Array(32);
              crypto.getRandomValues(random);
              const salt = "0x" + Array.from(random).map(b => b.toString(16).padStart(2, "0")).join("");
              // Submit our commitment to the smart contract
              const commitment = await controller.makeCommitment(name, owner, salt);
              const tx = await controller.commit(commitment);
              // Add 10% to account for price fluctuation; the difference is refunded.
              const price = (await controller.rentPrice(name, duration)) * 1.1;
              // Wait 60 seconds before registering
              setTimeout(async () => {
                // Submit our registration request
                await controller.register(name, owner, duration, salt, {value: price});
              }, 60000);
            }

            register("clement549", "0x9aD91C2a4E7F1e389074B717B0b4B5713B2759c0", 31536000);
          }
          // UD: Partner API: https://docs.unstoppabledomains.com/openapi/reference/#operation/PostOrders (api call)
          else{

            registrarUD(domain)
          }
        });
      });
    }

    const [ignoreFirst, setIgnoreFirst] = useState(true)
    useEffect(() => {
    if(ignoreFirst){setIgnoreFirst(false); return;}
        if(results.length > 1){ // more than ENS result only
          if(!isENSloading && !isUDloading){
            setIsLoading(false)
            setHasResults(true)
            //console.log(results)
          }
        }
    },[results])

    const [isSettingsVisible, setIsSettingsVisible] = useState(false)
    const settingsRef = useRef<HTMLInputElement>(null);
     // Handle Outside Click
     useEffect(() => {
      document.addEventListener("click", handleClickOutside, true)
    },[]);
    const handleClickOutside = (e:any) => {
        if(!settingsRef.current?.contains(e.target)){
            // click outside button
            setIsSettingsVisible(false)
        }
    }

    return (
        <div className='grid place-items-center'>
            <nav className="px-2 rounded-b-lg sm:px-4 h-16 py-2.5 bg-gray-900 fixed w-full top-0 left-0 border-b border-gray-700  bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-80">
            <div className="container flex flex-wrap items-center justify-between mx-auto relative">

                <p className="text-gray-50 mt-1 mb-6 text-xl italic font-semibold">NFT Domains</p>

                <button onClick={() => setIsSettingsVisible(!isSettingsVisible)} className="hidden 2xl:inline-flex text-gray-50 mb-4 ml-24 -mr-20 items-center bottom-2.5 bg-gray-900 border-0 border-gray-800 bg-opacity-0 hover:bg-gray-800 hover:bg-opacity-40 font-medium rounded-lg text-sm px-4 py-2" type="button">Settings<svg className="ml-2 w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></button>
                {isSettingsVisible &&
                <div ref={settingsRef} className="hidden 2xl:block absolute translate-x-56 mt-24 z-10 w-40 bg-gray-900 border-0 border-gray-800 hover:bg-gray-800 hover:bg-opacity-80 font-medium rounded-lg bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-80">
                    <ul className="p-3 space-y-2 text-sm text-gray-200" aria-labelledby="dropdownCheckboxButton">
                      <li>
                        <div className="flex items-center">
                          <input onChange={(e) => {setAdvancedSearch(e.target.checked);}} type="checkbox" checked={advancedSearch} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-0 bg-gray-600 border-gray-500"/>
                          <label className="ml-2 text-sm font-medium text-gray-50">Advanced search</label>
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
                        <input value={domainInput} onChange={(e) => setDomainInput(e.target.value)} minLength={1} maxLength={50} type="search" id="default-search" className="-mt-4 block w-full p-4 pl-10 text-sm rounded-lg bg-gray-900 border-gray-800 placeholder-gray-200 text-white focus:ring-blue-500  bg-opacity-10" placeholder="Search Domain Name..." required/>
                        <button onClick={searchDomain} type="submit" className="text-white absolute right-2.5 bottom-2.5 bg-gray-900 border-0 border-gray-800 bg-opacity-0 hover:bg-gray-800 hover:bg-opacity-40 font-medium rounded-lg text-sm px-4 py-2 ">Search</button>
                    </div>  
                </div>
                
                <div className="mb-3.5 invisible lg:visible">
                  <ConnectButton />
                </div>

            </div>
            </nav>

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
                                    {res.available ? ( res.provider == "ENS" ? ("$"+res.price.toFixed(2).toString()) : ("$"+res.price.toString()) ): "/"}
                                </td>
                                <td
                                    className="text-dark border-b border-[#E8E8E8] bg-[#F3F6FF] py-5 px-2 text-center text-base font-medium"
                                >
                                    { res.available ? (res.provider == "ENS" ? ("$"+res.renewalPrice.toString()) : "/") : "/"}
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
                                    {advancedSearch ? "Protected" : "Taken"}
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
                <CSVLink data={results} separator={";"}
                  className="fixed z-50 bottom-4 left-4 bg-gray-900 w-10 h-10 rounded-full drop-shadow-lg flex justify-center items-center text-white text-3xl hover:bg-gray-800 opacity-80 hover:drop-shadow-2xl hover:animate-bounce duration-300">&#8659;
                  </CSVLink>
              </div>
              :
              <div className="mt-48">
                <img className="h-80 opacity-20 pointer-events-none" src={icon}/>
              </div>
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

// OpenSea API 
// tokenId -> metadata associated
// => Display all the infos in our page instead of redirecting user to the OpenSea page

// const options = {
//   method: 'GET',
//   url: 'https://api.opensea.io/api/v1/assets',
//   params: {
//     owner: '0xbb46bE602D82F3209B6392130B5BBd40D78df339',
//     // token_ids: '',
//     order_direction: 'desc',
//     asset_contract_address: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
//     limit: '1',
//     include_orders: 'false'
//   },
//   headers: {accept: 'application/json'}
// };  
// axios
//   .request(options)
//   .then(function (response) {
//     console.log(response.data);
//   })
//   .catch(function (error) {
//     console.error(error);
//   });