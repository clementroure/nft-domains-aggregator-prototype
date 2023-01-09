
import "./popup.css"

export const MetadataPopup = (props: any) => {

    return (
    <div id="quit" className="h-full w-full fixed backdrop-blur-sm z-10">
        <div id="popup" ref={props.metadataPopupRef} className="w-full max-w-md p-4 m-auto rounded-md mt-28 lg:mt-48 shadow-md bg-gray-800">
           <p className="text-xl text-white text-center font-bold my-1 mb-6">Details</p>
           <div className="w-full items-center justify-start mx-auto text-center">
              <a className="w-full text-gray-50 text-center hover:underline" href={props.domainSelected.metadata} target="_blank">View on OpenSea</a>
           </div>
        </div>
    </div>
    )
  }