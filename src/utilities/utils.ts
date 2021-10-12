import {Tables} from './types'

/**
 * A utility function that, given a specified table, returns the 
 * primary key associated with that table.
 * @param table 
 * @returns the string primary key associated with that table.
 */

export const getPrimaryKey = (table : Tables) => {
    if(table === Tables.business) return 'business_id';
    if(table === Tables.stripeKey) return 'stripe_pk';
}