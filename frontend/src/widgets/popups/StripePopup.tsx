import { Elements } from "@stripe/react-stripe-js"
import CheckoutForm from "../../stripe/checkoutForm"

export const StripePopup = (props: any) => {

    const clientSecret = props.clientSecret;

    return (
    <div id="quit" className="h-full w-full fixed backdrop-blur-sm z-10">
        <div ref={props.stripePopupRef} className="w-full max-w-md p-4 m-auto rounded-md mt-28 lg:mt-48 shadow-md bg-gray-800">
          <Elements stripe={props.stripePromise} options={{clientSecret, appearance: {theme: "night", labels: 'floating', variables: {colorPrimary: "#141414"}}}}>
            <CheckoutForm />
          </Elements>
        </div>
    </div>
    )
  }