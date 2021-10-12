import express from 'express';
import Stripe from 'stripe';
import { Checkout } from './utilities/types';
import { db } from './database'


const server = express();
const PORT : number = 80;



server.listen(PORT, () => console.log(`Server started at ${PORT}`));
server.use(express.json())


server.post('/create-checkout-session', async (req, res) => {

  if(!Checkout.isRequest(req.body)) return res.status(400).json("Request body does not meet specifications of @types/Checkout.Request")

  try {
    const { business_id, products } = req.body as Checkout.Request;

    const stripe_sk = await db.getBusinessSecretKey(business_id);
      
    const stripe : Stripe = require('stripe')(stripe_sk);
  
    const line_items : Stripe.Checkout.SessionCreateParams.LineItem[] = await Promise.all(products.map( async (prod : Checkout.Product) =>{
      const productObject : Stripe.Product = await stripe.products.retrieve(prod.productId);
      const priceObject : Stripe.Price = (await stripe.prices.list({limit: 1, product: prod.productId})).data[0];
  
      return <Stripe.Checkout.SessionCreateParams.LineItem>{ 
          price: priceObject.id, 
          quantity: prod.quantity, 
          description: productObject.description
        }
      }))
      
    const session : Stripe.Checkout.Session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: line_items,
        mode: 'payment',
        success_url: 'https://vsedc.org',
        cancel_url: 'https://www.yourtango.com/sites/default/files/styles/header_slider/public/image_blog/im-not-happy.jpg?itok=sL6HolZI',
      })
  
      return res.status(200).json(session)
  }

  catch(error : any){

    if("statusCode" in error && "code" in error) return res.status(error.statusCode).json(error.code); //Indicates a Stripe Error formatting
    else return res.status(500).json(error); //Indicates some unhandled error

  }

    
  });
  