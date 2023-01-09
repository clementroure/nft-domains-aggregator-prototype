import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import {contractAddress as contractAddressENS} from "../../contracts/ens/ens_registrar_controller"
import {contractABI as contractABIens} from "../../contracts/ens/ens_registrar_controller"
import { ethers } from "ethers";
// all this have to be on the backend

// ENS Monitor -> new domain registered -> webhook to backend
// can filter !
// Expensive: free = only 1 contract + not a lot of calls
export const MoralisMonitoring = async () => {

    const addressToWatch = "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5"
    const options = {  
        chains: [EvmChain.ETHEREUM],
        description: "ENS Name Registrations",
        tag: "ensNameRegistration",
        abi: contractABIens,  
        topic0: ["NameRegistered(string,bytes32,address,uint256,uint256)"],  
        includeContractLogs: true,  
        advancedOptions: [  
        {  
            topic0: "NameRegistered(string,bytes32,address,uint256,uint256)",  
            "filter": {  
            "and": [  
                { "eq": ["owner", addressToWatch] },  
                { "gt": ["cost", "1000000000000000000"] }  
            ]  
            },  
            includeNativeTxs: true,  
        },  
        ],  
        webhookUrl: `${process.env.REACT_APP_BACKEND_URL}`
    };

    const stream = await Moralis.Streams.add(options);
    // Attach the contract address to the stream  
    await Moralis.Streams.addAddress({  
        id: stream.result.id, 
        address: contractAddressENS, 
    });
}

// Monitor ENS domains without moralis
// Can't filter events...
// 10 000 000 free request / month
// -> NM can run it on a server, get all registartions and keep only the interesting ones
// then save on the db -> give info to clients
export const AlchemyMonitoring = (_contract: any) => {

    const provider = new ethers.providers.WebSocketProvider(
        `wss://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_ETHEREUM_KEY}`
    );
    const contract = new ethers.Contract(contractAddressENS, contractABIens, provider);

    contract.on("NameRegistered", (name:any, label:any, address:any, cost:any, expires:any)=>{
        let transferEvent ={
            name: name,
            label: label,
            address: address,
            cost: cost.hex,
            expires: expires.hex
        }
        console.log(JSON.stringify(transferEvent, null, 4))
    })
}