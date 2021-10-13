

/**
 * Enumerations tables that exist in the DB and their respective primary keys
 * If you decide to add more relations / tables ensure that you add both a name enmeration and a primaryKey getter statement.
 * The values should be exactly the same as those added in SQL, but the member names can be anything.
 */

export namespace Tables{

    export enum Name {
        business = 'business',
        //Add more as needed
    }
    export const getPrimaryKeyOf = (table : Tables.Name) => {
        if(table == Tables.Name.business) return 'business_id';
        else throw new Error(`Tables.getPrimaryKeyOf has not implemented ${table}. Go to src/utilities/types.ts to implement!`)
        //Add more as needed
    }

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

    /**
     * A row namespace. If you decide to add more row types ensure that you update Generic and add additional
     * interfaces within this namespace.
     */

export namespace Row {

    /**
     * A generic type that ensures the object is one of the Rows defined in the namespace Row
     * If you decide to add more rows, and wish to use current methods, please update this.
     */

    export type Generic = Business //Add more as needed

    /**
     * An object representation of a business row
     * @member business_id - Refers to the unique primary key of the business
     * @member stripe_rk - Refers the the stripe restricted key found in the stripe dashboard.
     * Important! RK must allow for Checkout Session write and Plans read
     * @member business_name - Refers to the name of the business

     */

    export interface Business {
        business_id : number
        stripe_rk : string
        business_name : string
    }

    //Add more as needed



}









