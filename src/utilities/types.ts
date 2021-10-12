
/**
 * Requests that come from the client in order to initiate a purchase must contain these attributes.
 * @name productID is the unique identifier for the product in the database.
 * @name quantity the amount of this product to purchase.
 */

export interface CheckoutProduct{
    productId: string,
    quantity: number
}

export interface CheckoutRequest{

    business_id: number
    products : CheckoutProduct[]

}

export enum Tables{
    business = 'business',
    stripeKey = 'stripe_key'
}

export interface BusinessRow {
    business_id : number
    stripe_pk : string
    business_name : string
}

export const isBusinessRow = (object: unknown): object is BusinessRow => {
    return Object.prototype.hasOwnProperty.call(object, "business_id")
        && Object.prototype.hasOwnProperty.call(object, "stripe_pk")
        && Object.prototype.hasOwnProperty.call(object, "business_name");

}

export interface StripeKeysRow {
    stripe_pk : string
    stripe_sk : string
}

export const isStripeKeysRow = (object: unknown): object is BusinessRow => {
    return Object.prototype.hasOwnProperty.call(object, "stripe_pk")
        && Object.prototype.hasOwnProperty.call(object, "stripe_sk")
}


export type Row = BusinessRow | StripeKeysRow;



