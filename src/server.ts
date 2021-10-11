import express from 'express';
import Stripe from 'stripe';
import { CheckoutRequest } from './types';

const STRIPE_SECRET_KEY : string = 'sk_test_51IqWoeJsYPVWfSRX2FtBJJTNVc1ceEd1d9TJtz9aAT6F08rklRogPeXFyKeRFTcCb6AJSBqMc8XpsZWPM4wpe6vF00ZDTGQ1WP'
const stripe = require('stripe')(STRIPE_SECRET_KEY, {
    apiVersion: '2020-08-27',
    appInfo: { // For sample support and debugging, not required for production:
      name: "stripe-samples/checkout-one-time-payments",
      version: "0.0.1",
      url: "https://github.com/stripe-samples/checkout-one-time-payments"
    }
  });

const server = express();
const PORT : number = 443;



server.listen(PORT, () => console.log(`Server started at ${PORT}`));

server.use(express.static('../static'));
server.use(express.urlencoded({ extended: true }))


server.post('/create-checkout-session', async (req, res) => {

    const { productIds, quantity } = req.body as CheckoutRequest;


    const session : Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'T-shirt',
            },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://google.com',
      cancel_url: 'https://google.com',
    });
  
    res.redirect(303, session.url);
  });
  