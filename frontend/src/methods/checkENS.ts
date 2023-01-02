
  // let { data, loading, error } = useQuery(myQuery1, {
  //   variables: {
  //       domainName: domainName,
  //   },
  // });
  // let { data, loading, error } = useQuery(myQuery2, {
  //     variables: {
  //         labelHash: "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
  //     },
  // });
  
//   const myQuery1 = gql`
//   query domains($domainName : String!) {
//     domains(where:{name: $domainName})
//     {
//       labelhash
//     }
//   }
// `;
// const myQuery2 = gql`
// query domains($labelHash : String!) {
// registrations(where: {id: $labelHash}) 
// {
//     registrationDate
//     expiryDate
//     registrant {
//     id
//     }
// }
// }
// `;

const checkENS = (domainName: string) => {

  // console.log("Label Hash: " + (JSON.stringify(data["domains"][0]["labelhash"])));

  
  // var registration_date = new Date(parseInt(JSON.stringify(data.registrations[0].registrationDate).slice(1, -1)) * 1000);
  // var expiry_date = new Date(parseInt(JSON.stringify(data.registrations[0].expiryDate).slice(1, -1)) * 1000);

  // console.log("Registration Date: " + registration_date.toLocaleDateString("fr"));
  // console.log("Expiry Date: " + expiry_date.toLocaleDateString("fr"));
  // console.log("Registrant address: " + (JSON.stringify(data.registrations[0].registrant.id)));
}

export {checkENS};