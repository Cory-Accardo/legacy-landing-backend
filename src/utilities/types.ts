/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Written by Cory Accardo, Github: Cory-Accardo, email: accardo@usc.edu
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/




/**
 * Defines Checkout related interfaces. This typically will have to do with requests from the landing pages.
 */

export namespace Checkout{


    export interface Product{
        productId: string,
        quantity: number
    }



    export const isProduct = (object : any) => {
        return "productId" in object && typeof object.productId === 'string'
            && "quantity" in object && typeof object.quantity === 'number'
    }

    
    export interface Request{
        products : Product[]
    }


    export const isRequest = (object : any) => {
        return "products" in object && object.products.every( (product : any) => isProduct(product));
    }


}

export namespace LegacyModel {


    export interface Config {
        service_cut : number,
    }

    export const isConfig = (object: any) =>{
        return "service_cut" in object && typeof object.service_cut === 'number'

    }
    
}









