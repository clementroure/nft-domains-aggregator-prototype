import { Link } from "react-router-dom";

function Error404 () {

    return(
      <div className='grid place-items-center m-10'>
       <p className="text-gray-50">ERROR404: This page does not exist.</p>
       <Link to="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-8">
          Back to menu
        </Link>
     </div>
    );

}

export default Error404;