// methode alternative sans API
const checkSpecificUD = (domainName: string) => {

  const { default: Resolution } = require('@unstoppabledomains/resolution');
  const resolution = new Resolution();

  const resolve = (domain:string, currency:string) => {
    resolution
      .addr(domain, currency)
      .then((address:any) => {
        console.log(domain, 'resolves to', address)
        return false;
    })
      .catch(() => {
        console.log(domain + " is free !")
        return true;
      });
  }

  resolve(domainName, 'ETH');
}

const checkAllUD = (domainName: string, setResults: any, searchMetadata: boolean, setIsUDloading: any) => {

    const UDVerifyDisponibility = () => {

      let _results: {name: string, extension: string, available: boolean, provider: string, blockchain: string, price: number, renewalPrice: number, startDate: Date, endDate: Date, metadata: string}[] = []

      fetch(`https://unstoppabledomains.com/api/domain/search?q=${domainName}`)
      .then((res) => res.json())
      .then(async (data) => {
        for (let i =0; i< 9; i++){
          //console.log(data.exact[i].productCode + ": " + data.exact[i].availability);
          var index = data.exact[i].productCode.indexOf(".");  // Gets the first index where a space occours
          var name = data.exact[i].productCode.substr(0, index); // Gets the first part
          var extension = "."+data.exact[i].productCode.substr(index + 1);  // Gets the text part

          const _price = data.exact[i].price != -1 ? data.exact[i].price / 100 : -1
          const _available = data.exact[i].availability

          if(data.exact[i].availability == false && searchMetadata){

            await fetch(`https://resolve.unstoppabledomains.com/metadata/${domainName+extension}`)
            .then((res) => res.json())
            .then((data) => {
              var token_id = data.tokenId;

              if(token_id != null){
                _results.push({name: name, extension: extension, provider: "UD", blockchain: extension == ".crypto" ? "Ethereum" : "Polygon", available: _available, price: _price, renewalPrice: -1, startDate: new Date(), endDate: new Date(), metadata: extension != ".crypto" ? "https://opensea.io/assets/matic/0xa9a6a3626993d487d2dbda3173cf58ca1a9d9e9f/"+token_id : "https://opensea.io/assets/ethereum/0xd1e5b0ff1287aa9f9a268759062e4ab08b9dacbe/"+token_id})
              }
              else{
                _results.push({name: name, extension: extension, provider: "UD", blockchain: extension == ".crypto" ? "Ethereum" : "Polygon", available: _available, price: _price, renewalPrice: -1, startDate: new Date(), endDate: new Date(), metadata: ""})
              }
            });
          }
          else{

            _results.push({name: name, extension: extension, provider: "UD", blockchain: extension == ".crypto" ? "Ethereum" : "Polygon", available: _available, price: _price, renewalPrice: -1, startDate: new Date(), endDate: new Date(),  metadata: ""})
          }
        }

        setResults((prevData: any) => [...prevData, ..._results]);
        setIsUDloading(false);
        
      })
      .catch((err) => {
        console.log(err.message);
      });

    }

    UDVerifyDisponibility();
}

const registrarUD = async (domain: any, myAddress: string, email: string) => {

  const resellerId = `${process.env.resellerId}`;
  const resp = await fetch(
    `https://unstoppabledomains.com/api/v2/resellers/${resellerId}/orders`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer <YOUR_JWT_HERE>'
      },
      body: JSON.stringify({
        payment: {
          method: 'stripe',
          properties: {
            tokenId: 'tok_1FAeVFG8PQyZCUJhJp7emswP'
          }
        },
        security: [
          {
            type: 'fingerprintjs',
            identifier: 'i2udKSvRFcN1wOqGLk3J'
          }
        ],
        domains: [
          {
            name: domain.name + domain.extension,
            ownerAddress: myAddress,
            email: email,
            resolution: {
              'crypto.ETH.address': myAddress,
              //'crypto.BTC.address': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
            },
            resellerIdentityKey: 'string'
          }
        ]
      })
    }
  );

  const data = await resp.json();
  console.log(data);
}

// Check if transaction has been mined
const orderStatus = async (orderNumber: string) => {

  const resellerId = `${process.env.resellerId}`;
  const resp = await fetch(
    `https://unstoppabledomains.com/api/v2/resellers/${resellerId}/orders/${orderNumber}`,
    {method: 'GET'}
  );

  const data = await resp.text();
  console.log(data);
}

export {checkSpecificUD, checkAllUD, registrarUD, orderStatus};