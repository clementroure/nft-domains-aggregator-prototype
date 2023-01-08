const express = require("express")
const app = express();
const https = require('https');
require('dotenv').config();
const ethers = require('ethers');
const { contractAddress_ens, contractABI_ens, 
        contractAddress_ud_polygon, contractABI_ud_polygon, 
        contractAddress_ud_ethereum, contractABI_ud_ethereum, 
      } 
= require('./contracts.js');
var fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const admin = require("firebase-admin");
var nodemailer = require('nodemailer');

// Firebase NoSQL DB Initialization //
var serviceAccount = require("./google.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.FB_DATABASE_URL}`
});
const db = admin.firestore();

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

function send_email(data){

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'contactlordly@gmail.com',
      pass: `${process.env.EMAIL_PASS}`
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  var mailOptions = {
    from: 'contactlordly@gmail.com',
    to: 'clementroure@orange.fr',
    subject: 'Domain Alert !',
    text: 'The address ' + data.data.address + ' has registered the domain ' + data.data.name + '.eth ' + 'on ' + data.registration_date
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

function monitoring(){

  const provider_ethereum = new ethers.providers.WebSocketProvider(
    `wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETHEREUM_KEY}`
  );
  const provider_polygon = new ethers.providers.WebSocketProvider(
    `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_KEY}`
  );

  const contract_ens = new ethers.Contract(contractAddress_ens, contractABI_ens, provider_ethereum);
  const contract_ud_polygon = new ethers.Contract(contractAddress_ud_polygon, contractABI_ud_polygon, provider_polygon);
  const contract_ud_ethereum = new ethers.Contract(contractAddress_ud_ethereum, contractABI_ud_ethereum, provider_ethereum);

  // Monitor ENS
  contract_ens.on("NameRegistered", async (name, label, address, cost, expires)=>{
      let transferEvent ={
          name: name,
          label: label,
          address: address,
          cost: ethers.utils.formatEther(cost),
          expires: parseInt(expires,16)
      }

      // Check if the registration is under our supervision:
      if(targetAdressList.includes(transferEvent.address) || targetNameList.some(e => e.includes(transferEvent.address))){  // is there a substring of target in the array ?
          console.log("TARGET: ")
          console.log(transferEvent)
          // save alerts data locally
          fs.appendFile("./tmp/alerts.txt", JSON.stringify(transferEvent), function(err) {
            if (err) {
                console.log(err);
            }
          });
          // Save infos to DB
          const id = uuidv4();
          const registration_date = new Date();
          const data = {
            id: id,
            registration_date: registration_date,
            target_name: targetNameList,
            target_adress: targetAdressList,
            data: transferEvent
          };  
          await db.collection('ens_domains').doc(id).set(data).catch(err => console.log(err));
          // Send Email / Telegram msg to alert client / NM ?
          send_email(data);
      }
      else{
        // debug
        console.log("random ens registration: ")
        console.log(transferEvent)

        const id = uuidv4();
        const registration_date = new Date();
        const data = {
          id: id,
          registration_date: registration_date,
          target_name: targetNameList,
          target_adress: targetAdressList,
          data: transferEvent
        };  
        // save alerts data locally
        fs.appendFile("./tmp/alerts.txt", JSON.stringify(transferEvent)+"\n", function(err) {
          if (err) {
              console.log(err);
          }
        });
        // await db.collection('ens_domains').doc(id).set(data).catch(err => console.log(err));
        // send_email(data);
      }
  });

  // WARNING -> Get ABI of the implemented contracts not the abi of the proxy contract !

  // Monitor UD polygon
  contract_ud_polygon.on("Transfer", async (from, to, tokenId)=>{
    let transferEvent ={
      address: to,
      token_id: tokenId.toString()
    }
    console.log("UD polygon: ")
    console.log(transferEvent)

    const id = uuidv4();
    const registration_date = new Date();
    const data = {
      id: id,
      registration_date: registration_date,
      blockchain: "polygon",
      data: transferEvent
    };  
    await db.collection('ud_domains').doc(id).set(data).catch(err => console.log(err));
  });

  // Monitor UD ethereum
  contract_ud_ethereum.on("Transfer", async (from, to, tokenId)=>{
    let transferEvent ={
      address: to,
      token_id: tokenId.toString()
    }
    console.log("UD ethereum: ")
    console.log(transferEvent)

    const id = uuidv4();
    const registration_date = new Date();
    const data = {
      id: id,
      registration_date: registration_date,
      blockchain: "ethereum",
      data: transferEvent
    };  

    await db.collection('ud_domains').doc(id).set(data).catch(err => console.log(err));
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