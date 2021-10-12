

/**
 * Enumerations of the various relations in the sqlite3 database (see the ERD in the /db directory). The values are the table names.
 */

export enum Tables{
    business = 'business',
    stripeKey = 'stripe_key'
}

/**
 * Defines Checkout related interfaces. This typically will have to do with requests from the landing pages.
 */

export namespace Checkout{

    /**
     * An object representation of a product that a user may buy on the landing page.
     * @member productId - Refers to the unique identifier of the product in Stripe's internal database. Accessible through Stripe.products.retrieve();
     * @member quantity - Refers to the number of this product to buy
     */

    export interface Product{
        productId: string,
        quantity: number
    }

    export const isProduct = (object : any) => {
        return "productId" in object && typeof object.productId === 'string'
            && "quantity" in object && typeof object.quantity === 'number'
    }

    /**
     * An object representation of a checkout request body that will be sent from the front-end
     * @member business_id - Refers to the unique identifier of the business. The list of business id's can be found on the respective excel file.
     * @member products - An array of the Checkout.Products that will be purchased.
     */
    
    export interface Request{
        business_id: number
        products : Product[]
    }

    export const isRequest = (object : any) => {
        return "business_id" in object && typeof object.business_id === 'number'
            && "products" in object && object.products.every( (product : any) => isProduct(product));
    }


}

export namespace Row {

    export type Generic = Business | StripeKeys

    export interface Business {
        business_id : number
        stripe_pk : string
        business_name : string
    }

    export const isBusiness = (object: any) => {
        return "business_id" in object && typeof object.business_id === 'number'
            && "stripe_pk" in object && typeof object.stripe_pk === 'string'
            && "business_name" in object && typeof object.business_name === 'string'
    
    }

    export interface StripeKeys {
        stripe_pk : string
        stripe_sk : string
    }

    export const isStripeKeys = (object: any): object is StripeKeys => {
        return "stripe_pk" in object && typeof object.stripe_pk === 'string'
            && "stripe_sk" in object && typeof object.stripe_sk === 'string'
    }

}









