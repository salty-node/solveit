import {
  GenezioDeploy,
  GenezioHttpRequest,
  GenezioHttpResponse,
  GenezioMethod,
} from "@genezio/types";
import Stripe from "stripe";
import pg from "pg";

const { Pool } = pg;
// Use the Stripe API Key clientSecret to initialize the Stripe Object
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

@GenezioDeploy()
export class StripeService {
  pool = new Pool({
    connectionString: process.env["SOLVEIT_DATABASE_URL"],
    ssl: true,
  });

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

  @GenezioMethod({ type: "http" })
  async webhook(req: GenezioHttpRequest): Promise<GenezioHttpResponse> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return { statusCode: "400", body: "Webhook Error" };
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Fulfilling order", session);

      console.log("Order fulfilled successfully"); // Log when the order is fulfilled successfully
      return { statusCode: "200", body: "Order fulfilled" };
    }

    return { statusCode: "200", body: "Success" };
  }
}
