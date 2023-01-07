const express = require("express")
const app = express()
const https = require('https');
require('dotenv').config();
const ethers = require('ethers');
const { contractAddress_ens, contractABI_ens, 
        contractAddress_ud, contractABI_ud 
      } 
= require('./contracts.js');

const targetAdressList = ["0x9aD91C2a4E7F1e389074B717B0b4B5713B2759c0"]
const targetNameList = ["clement549"]

// CORS Policy
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Credentials', '*');
  next();
});

function monitoring(){

  const provider_ethereum = new ethers.providers.WebSocketProvider(
      `wss://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_ETHEREUM_KEY}`
  );
  const provider_polygon = new ethers.providers.WebSocketProvider(
    `wss://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_POLYGON_KEY}`
  );

  const contract_ens = new ethers.Contract(contractAddress_ens, contractABI_ens, provider_ethereum);
  const contract_polygon = new ethers.Contract(contractAddress_polygon, contractABI_polygon, provider_polygon);

  contract_ens.on("NameRegistered", (name, label, address, cost, expires)=>{
      let transferEvent ={
          name: name,
          label: label,
          address: address,
          cost: ethers.utils.formatEther(cost),
          expires: parseInt(expires,16)
      }
      let json = JSON.stringify(transferEvent);

      // Check if the registration is under our supervision:
      if(targetAdressList.includes(json.address) || targetNameList.includes(json.name)){
          console.log("TARGET: ")
          console.log(json)
          // Save infos to DB
          
          // Send Email / Telegram msg to alert client / NM ?

      }
      else{
        // debug
        console.log("random registration: ")
        console.log(json);
      }
      console.log()
  });
}

monitoring();

/// GET ///

// Webhook endpoint if using Moralis
app.get('/moralis-monitoring',(req,res) => {
 
  console.log(req);
});

app.listen(4000, () => {
  console.log("App is listening to port 4000")
});