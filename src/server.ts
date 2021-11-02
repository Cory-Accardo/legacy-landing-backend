/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Written by Cory Accardo, Github: Cory-Accardo, email: accardo@usc.edu
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { Checkout, Row } from './utilities/types';
import {isAuthorized} from './utilities/middleware';
import { db } from './database';
import path from 'path';

require('dotenv').config({ path: path.join(__dirname, '../', '.env')})

if( !("ADMIN_PASS" in process.env) ) throw Error("Environment file does not include: ADMIN_PASS");

const server = express();
const PORT : number = 80;


server.listen(PORT, () => console.log(`Server started at ${PORT}`));
server.use(express.json(), cors({
  origin: '*'
}))



server.post('/create-checkout-session', async (req, res) => {

  try {
    
    if(!Checkout.isRequest(req.body)) return res.status(400).json("Request body does not meet specifications of @types/Checkout.Request")

    const { business_id, products } = req.body as Checkout.Request;

    const stripe_rk = await db.getBusinessRestrictedKey(business_id);
      
    const stripe : Stripe = require('stripe')(stripe_rk);
  
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


  server.post('/create-business', isAuthorized, async (req, res) =>{

    try{

      if(!Row.isBusiness(req.body))  return res.status(400).json("Request body does not meet specifications of @types/Row.Business");
      const { business_id, stripe_rk, business_name } = req.body;
      await db.createBusiness(business_id, stripe_rk, business_name);
      return res.status(200).json("Success");

    }
    catch(error : any){

      return res.status(500).json(error); //Indicates some unhandled error
  
    }
  })

  server.post('/read-businesses', isAuthorized, async (req, res) =>{

    try{

      return res.status(200).json(await db.readBusinesses());

    }
    catch(error : any){

      return res.status(500).json(error); //Indicates some unhandled error
  
    }
  })

  server.post('/update-business', isAuthorized, async (req, res) =>{

    try{

      if( ! ("business_id" in req.body && typeof req.body.business_id === 'number') )  return res.status(400).json("Request body must include a business_id");
      const { business_id, stripe_rk, business_name } = req.body;
      await db.updateBusiness(business_id, stripe_rk, business_name);
      return res.status(200).json("Success");

    }
    catch(error : any){

      return res.status(500).json(error); //Indicates some unhandled error
  
    }
  })

  server.post('/delete-business', isAuthorized, async (req, res) =>{

    try{

      if( ! ("business_id" in req.body && typeof req.body.business_id === 'number') )  return res.status(400).json("Request body is improperly formatted. Should be {business_id: number}");
      const { business_id } = req.body;
      await db.deleteBusiness(business_id);
      return res.status(200).json("Success");

    }
    catch(error : any){

      return res.status(500).json(error); //Indicates some unhandled error
  
    }
  })


  