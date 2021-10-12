

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

    /**
     * A user defined type guard for a Product interface
     * @param object - The object to be verified
     * @returns true/false as to whether the object confomrs to Product interface.
     */

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

    /**
     * A user defined type guard for a Request interface
     * @param object - The object to be verified
     * @returns true/false as to whether the client request body conforms to the Request interface
     */

    export const isRequest = (object : any) => {
        return "business_id" in object && typeof object.business_id === 'number'
            && "products" in object && object.products.every( (product : any) => isProduct(product));
    }


}

export namespace Row {

    /**
     * A generic type that ensures the object is one of the Rows defined in the namespace Row
     */

    export type Generic = Business | StripeKeys

    /**
     * An object representation of a business row
     * @member business_id - Refers to the unique primary key of the business
     * @member stripe_pk - Refers the the stripe public key found in the stripe dashboard
     * @member business_name - Refers to the name of the business

     */

    export interface Business {
        business_id : number
        stripe_pk : string
        business_name : string
    }

    /**
     * A user defined type guard for a Business interface
     * @param object - The object to be verified
     * @returns true/false as to whether the object conforms to the Business interface
     */

    export const isBusiness = (object: any) => {
        return "business_id" in object && typeof object.business_id === 'number'
            && "stripe_pk" in object && typeof object.stripe_pk === 'string'
            && "business_name" in object && typeof object.business_name === 'string'
    
    }

    /**
     * An object representation of a stripe_keys row
     * @member stripe_pk - Refers the the stripe public key found in the stripe dashboard
     * @member stripe_sk - Refers the the stripe secret key found in the stripe dashboard
     */

    export interface StripeKeys {
        stripe_pk : string
        stripe_sk : string
    }

    /**
     * A user defined type guard for a StripeKEys interface
     * @param object - The object to be verified
     * @returns true/false as to whether the object conforms to the StripeKeys interface
     */

    export const isStripeKeys = (object: any): object is StripeKeys => {
        return "stripe_pk" in object && typeof object.stripe_pk === 'string'
            && "stripe_sk" in object && typeof object.stripe_sk === 'string'
    }

}









