import { getENSgasPrice } from "../methods/api/checkENS";

 export const Table = (props:any) => {
    return(
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
                {props.results.map((res: any, index: number) => (
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
                        {props.resultsUI[index]?.isLoading == false ?
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
                            props.setResultsUI((_resultsUI:any)=> _resultsUI.map((_resultUI:any, i:number) => i === index ? {isLoading: true} : _resultUI));
                            await getENSgasPrice(props.results, props.setResults, index, props.resultsUI, props.setResultsUI);
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
                        {props.resultsUI[index].isLoading == false ?
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
                        onClick={() => props.buyBtn(index)}
                        className="cursor-pointer border-primary text-primary hover:bg-primary inline-block rounded border py-2 px-6 hover:border-gray-900"
                        >
                        Buy
                        </a>
                        :
                        <>
                        {res.metadata != "" ?
                        <>
                        {res.extension != ".zil" ?
                        <button onClick={() => {props.setDomainSelected(props.results[index]); props.setMetadataPopupVisible(true);}} className="cursor-pointer hover:underline">
                        Taken
                        </button>
                        :
                        <>
                        Taken
                        </>
                        }
                        </>
                        :
                        <>
                        {props.searchMetadata ? "Protected" : "Taken"}
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
    );
}