

/**
 * Requests that come from the client in order to initiate a purchase must contain these attributes.
 * @name productID is the unique identifier for the product in the database.
 * @name quantity the amount of this product to purchase.
 */

export interface CheckoutRequest{

    productIds: string[] //should refer the list of Ids that will be purchased
    quantity: number //should refer to the number of items to buy

}

export interface BusinessRow {
    business_id : number
    stripe_pk : string
    business_name : string
}

export interface ProductsRow {
    business_id : number
    stripe_pk : string
    business_name : string
}

export interface StripeKeysRow {
    stripe_pk : string
    stripe_sk : string
}
