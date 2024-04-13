
import {
  GenezioDeploy,
  GenezioMethod,
  GenezioHttpRequest,
  GenezioHttpResponse,
} from "@genezio/types";
import Stripe from "stripe";
// Use the Stripe API Key clientSecret to initialize the Stripe Object
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

@GenezioDeploy()
export class StripeService {
  async createCheckoutSession(): Promise<string> {
    const stripePromise = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "RON",
            product_data: {
              name: "Tokens",
            },
            unit_amount: 1000, // 20.00 USD
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}?canceled=true`,
    });

    return stripePromise.url || "";
  }
}