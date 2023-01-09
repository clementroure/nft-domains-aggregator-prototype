import { ConnectButton } from "@rainbow-me/rainbowkit";

export const Navbar = (props: any) => {
    return(
    <nav className="px-2 rounded-b-lg sm:px-4 h-16 py-2.5 bg-gray-900 fixed w-full top-0 left-0 border-b border-gray-700  bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-80">
      <div className="container flex flex-wrap items-center justify-between mx-auto relative">

          <p className="text-gray-50 mt-1 mb-6 text-xl italic font-semibold">NFT Domains</p>

          <button onClick={() => props.setIsSettingsVisible(!props.isSettingsVisible)} className="hidden 2xl:inline-flex text-gray-50 mb-4 ml-24 -mr-20 items-center bottom-2.5 bg-gray-900 border-0 border-gray-800 bg-opacity-0 hover:bg-gray-800 hover:bg-opacity-40 font-medium rounded-lg text-sm px-4 py-2" type="button">Settings<svg className="ml-2 w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></button>
          {props.isSettingsVisible &&
          <div ref={props.settingsRef} className="hidden 2xl:block absolute translate-x-56 mt-40 z-10 w-40 bg-gray-900 border-0 border-gray-800 hover:bg-gray-800 hover:bg-opacity-80 font-medium rounded-lg bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-80">
              <ul className="p-3 space-y-2 text-sm text-gray-200" aria-labelledby="dropdownCheckboxButton">
                <li>
                  <div className="flex items-center">
                    <input onChange={(e) => {props.setSearchMetadata(e.target.checked);}} type="checkbox" checked={props.searchMetadata} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-0 bg-gray-600 border-gray-500"/>
                    <label className="ml-2 text-sm font-medium text-gray-50">Get metadata</label>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <input onChange={(e) => {props.setSearchForENS(e.target.checked);}} type="checkbox" checked={props.searchForENS} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-0 bg-gray-600 border-gray-500"/>
                    <label className="ml-2 text-sm font-medium text-gray-50">ENS domains</label>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <input onChange={(e) => {props.setSearchForUD(e.target.checked);}} type="checkbox" checked={props.searchForUD} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-0 bg-gray-600 border-gray-500"/>
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
                    <input value={props.domainInput} onChange={(e) => props.setDomainInput(e.target.value)} minLength={1} maxLength={1000} type="search" id="default-search" className="-mt-4 pr-[90px] block w-full p-4 pl-10 text-sm rounded-lg bg-gray-900 border-gray-800 placeholder-gray-200 text-white focus:ring-blue-500  bg-opacity-10" placeholder="Search Domain Name..." required/>
                    <button onClick={(e) => props.searchDomain(e)} type="submit" className="text-white absolute right-2.5 bottom-2.5 bg-gray-900 border-0 border-gray-800 bg-opacity-0 hover:bg-gray-800 hover:bg-opacity-40 font-medium rounded-lg text-sm px-4 py-2 ">Search</button>
                  </form>
              </div>  
          </div>
          
          <div className="mb-3.5 invisible lg:visible">
            <ConnectButton />
          </div>

      </div>
    </nav>
    );
}