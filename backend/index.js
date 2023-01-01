const express = require("express")
const app = express()
const https = require('https');
require('dotenv').config();
var crypto = require('crypto');

// CORS Policy
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Credentials', '*');
    next();
  });

/// GET ///

app.get('/test',(req,res) => {

  
});

app.listen(4000, () => {
console.log("App is listening to port 4000")
});