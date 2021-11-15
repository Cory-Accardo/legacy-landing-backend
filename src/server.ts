/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Written by Cory Accardo, Github: Cory-Accardo, email: accardo@usc.edu
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { Checkout } from './utilities/types';
import { db } from './database';
import path from 'path';

//Routers
import configRouter from './routes/config'

require('dotenv').config({ path: path.join(__dirname, '../', '.env')})
if( !("STRIPE_SK" in process.env) ) throw Error("Environment file does not include: STRIPE_SK");
if( !("WEBHOOK_SECRET" in process.env) ) throw Error("Environment file does not include: WEBHOOK_SECRET");

enum CONSTANTS{
  DONATION_ACCOUNT = 'donation', //This is the metatag account_id that will indicate a donation.
  PORT = 3000
}

const stripe : Stripe = require('stripe')(process.env.STRIPE_SK);
const server = express();



server.listen(CONSTANTS.PORT, () => console.log(`Server started at ${CONSTANTS.PORT}`));
server.use(cors({
  origin: '*'
}))

//Routes for config modification
server.use('/config', configRouter);



server.post('/create-checkout-session', express.json(),  async (req, res) => {
  

  try {
    
    if(!Checkout.isRequest(req.body)) return res.status(400).json("Request body does not meet specifications of @types/Checkout.Request")

    const { products } = req.body as Checkout.Request;
    
    
      
  
    const line_items : Stripe.Checkout.SessionCreateParams.LineItem[] = await Promise.all(products.map( async (prod : Checkout.Product) =>{
      const productObject : Stripe.Product = await stripe.products.retrieve(prod.productId);
      const priceObject : Stripe.Price = (await stripe.prices.list({limit: 1, product: prod.productId})).data[0];
      const account_id = productObject.metadata.account_id;

      if(account_id !== CONSTANTS.DONATION_ACCOUNT) await stripe.accounts.retrieve(account_id); //This is to verify that it is a valid account_id associated;

      return <Stripe.Checkout.SessionCreateParams.LineItem>{ 
        price: priceObject.id, 
        quantity: prod.quantity,
        description: productObject.description,
      }
    }))
    

      
      
  const session : Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      automatic_tax: {enabled: true},
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: 'https://vsedc.org',
      cancel_url: 'https://www.yourtango.com/sites/default/files/styles/header_slider/public/image_blog/im-not-happy.jpg?itok=sL6HolZI',
    })
  
    return res.status(200).json(session)
  }

  catch(error : any){
    console.log(error);
    
    if("statusCode" in error && "code" in error) return res.status(error.statusCode).json(error.code); //Indicates a Stripe Error formatting
    else return res.status(500).json(error); //Indicates some unhandled error

  }
    
  });

  


  server.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {

    const sig = request.headers['stripe-signature'] as string;


    const endpointSecret = process.env.WEBHOOK_SECRET as string;
  
    let event : Stripe.Event;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err : any) {
      console.log(err.message);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    
    try{
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const serviceFee = (await db.readConfig()).service_cut;
          const paymentIntentObject = await stripe.paymentIntents.retrieve(session.payment_intent as string)

          lineItems.data.forEach(async (item)=>{ //For each item we need to direct transfers to appropriate businesses
            const {amount_total} = item;  //The total price of the item AFTER taxes and discounts are deducted
            const {metadata} = (await stripe.products.retrieve(item.price!.product as string)); //retrieve the metadata of the business.
            const amountToBusiness = Math.floor( (amount_total * (1-serviceFee) ) ) * item.quantity!;

            if(metadata!.account_id !== CONSTANTS.DONATION_ACCOUNT){ //this indicates that this is not a donation
              stripe.transfers.create({
                amount: amountToBusiness,
                currency: 'usd',
                destination: metadata!.account_id,
                source_transaction: paymentIntentObject.charges.data[0].id
              })
            }
            
          })
          

          break;
        // ... handle other event types
        default:
      }
    }
    catch(err : any){
      //Add some sort of email notification.
      console.log(err);
      response.status(500);
    }
  
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  })