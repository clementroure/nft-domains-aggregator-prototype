import { useQuery } from "@apollo/client";
import { ethers } from "ethers";
import { useEffect } from "react";
import { domainsQuery, registrationsQuery } from "./queries";

export default function CheckENS(ENSdomainInput: string, ensController:any, isLoading: boolean, hasResults: boolean, setENSlabelHash: any, setIsENSloading: any, setResults: any, ENSlabelHash: string) {

     // ENS call 1 -> labelhash
     let { data, loading, error } = useQuery(domainsQuery, {
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
            const ethPrice = parseInt((await ensController.rentPrice(name, 31536000))._hex, 16) / (10**18);

            await fetch(`https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD`)
            .then((res) => res.json())
            .then((data) => {
              const _price = parseFloat(data.USD) * ethPrice;

              setResults((prevData:any) => [{name: name, extension:".eth", provider: "ENS", blockchain: "Ethereum", startDate: new Date(), endDate: new Date(), price: _price, renewalPrice: _price, available: true, metadata: ""}, ...prevData])
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
    let { data : data2, loading : loading2, error : error2 } = useQuery(registrationsQuery, {
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

            const tokenId = getTokenId(name);

            const ethPrice = parseInt((await ensController.rentPrice(name, 31536000))._hex, 16) / (10**18);

            await fetch(`https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD`)
            .then((res) => res.json())
            .then((data) => {
              const _price = parseFloat(data.USD) * ethPrice;

              setResults((prevData:any) => [{name: name, extension:".eth", provider: "ENS", blockchain: "Ethereum", startDate: registration_date, endDate: expiry_date, price: _price, renewalPrice: _price, available: false, metadata: "https://opensea.io/fr/assets/ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/" + tokenId}, ...prevData]) // or link to etherscan tx
              setIsENSloading(false);
            });
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

    // get tokenID from domain.eth -> https://docs.ens.domains/dapp-developer-guide/ens-as-nft
    const getTokenId = (_name: string) => {

        const BigNumber = ethers.BigNumber
        const utils = ethers.utils
        const labelHash = utils.keccak256(utils.toUtf8Bytes(_name))
        const tokenId = BigNumber.from(labelHash).toString()
    }
}