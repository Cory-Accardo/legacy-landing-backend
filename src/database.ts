import { sqlite3 } from "sqlite3";
import { Tables, Row} from './utilities/types';
import { getPrimaryKey } from './utilities/utils';

const DB_FILEPATH = '../db/legacy.db';
const sqlite3 : sqlite3 = require('sqlite3').verbose();


class legacyDatabase extends sqlite3.Database{

    constructor(){
        super(DB_FILEPATH, (err) => {
            if (err) console.error(err.message);
            else console.log('Connected to database');
          });
    }

    /**
     * Forms tables with proper SQL create table queries. Useful if starting database from scratch.
     * @returns A boolean Promise to form these tables
     * @throws a rejection if any of these tables formed an error.
     */
    
    private formTables(): Promise<Boolean>{
        return new Promise<Boolean> ((resolve, reject) =>{
        this.run(`CREATE TABLE ${Tables.business} (business_id INTEGER PRIMARY KEY, stripe_pk TEXT NOT NULL UNIQUE, business_name TEXT NOT NULL);`, (err: Error) =>{
            if(err) reject(err);
                this.run(`CREATE TABLE ${Tables.stripeKey} (stripe_pk BLOB PRIMARY KEY, stripe_sk BLOB NOT NULL UNIQUE);`, (err: Error)=>{
                    if(err) reject(err);
                    resolve(true);
                })
            })
        })
    }

    /**
     * Deletes all tables in the database
     * @returns A boolean Promise to dekete these tables
     * @throws a rejection if any of these deletions formed an error.
     */

    private deleteTables(): Promise<Boolean>{
        return new Promise<Boolean> ((resolve, reject) =>{
        this.run(`DROP TABLE ${Tables.business};`, (err: Error) =>{
            if(err) reject(err);
                this.run(`DROP TABLE ${Tables.stripeKey};`, (err: Error)=>{
                    if(err) reject(err);
                    resolve(true);
                })
            })
        })
    }

    //The following are internal CRUD methods to safely modify the database without using SQL.

     /**
     * Adds an entirely new row based on the table type passed in.
     * @returns A boolean Promise to add the row
     * @throws a rejection if the row was unable to add.
     */

    private createRow( row : Row.Generic ): Promise<Boolean>{

        return new Promise<Boolean> ((resolve,reject) =>{
            
            if(Row.isBusiness(row)){
                row = row as Row.Business;
                const {business_id, stripe_pk, business_name} = row;
                this.run(`INSERT INTO ${Tables.business} VALUES(${business_id}, "${stripe_pk}","${business_name}");`, (err : Error) =>{
                    if(err) reject(err);
                    resolve(true);
                });
            }

            else if(Row.isStripeKeys(row)){
                row = row as Row.StripeKeys;
                const {stripe_pk, stripe_sk} = row;
                this.run(`INSERT INTO ${Tables.stripeKey} VALUES("${stripe_pk}", "${stripe_sk}");`, (err : Error) =>{
                    if(err) reject(err);
                    resolve(true);
                });
            }
            else{
                reject("Invalid Row");
            }

        })
    }

    /**
     * Reads a given row and returns an object representation of that data.
     * @param keyValue The value of the primary key of the row to be read
     * @param table  The table of the row to be read
     * @returns Promise for a Row type
     */

    private readRow(keyValue : number | string, table : Tables): Promise<Row.Generic>{

        return new Promise <Row.Generic> ( (resolve, reject) =>{
            this.get(`SELECT * FROM ${table} WHERE ${getPrimaryKey(table)}="${keyValue}";` , (err: Error, data : Row.Generic)=>{
                if(err) reject(err);
                resolve(data);
            })
        })
    }

    /**
     * Updates a row - note how there is no update capabilities for the stripe_keys table.
     * This is because a public key is necessarily related to its private key. Thus, you should just
     * create a new row if necessary.
     * @param row - The row object that you wish to replace the current one with. Ensure that it
     * contains the same primary key value!
     * @returns A promise to update the replace a given row with the new row object
     */
    private updateRow( row : Row.Generic): Promise<Boolean>{

        return new Promise<Boolean> ((resolve,reject) =>{
            
            if(Row.isBusiness(row)){
                row = row as Row.Business;
                const {business_id, stripe_pk, business_name} = row;
                this.run(`UPDATE ${Tables.business} SET stripe_pk='${stripe_pk}', business_name="${business_name}" WHERE business_id=${business_id};`, (err : Error) =>{
                    if(err) reject(err);
                    resolve(true);
                });
            }

            else{
                reject("Invalid Row");
            }

        })
    }

    /**
     * Deletes a row
     * @param keyValue The value of the primary key to be deleted
     * @param table The table to delete the row from
     * @returns a Promise to deltre the row.
     */

    private deleteRow(keyValue : number | string, table : Tables): Promise<Boolean>{
        return new Promise<Boolean> ((resolve, reject) =>{
            this.run(`DELETE FROM ${table} WHERE ${getPrimaryKey(table)}="${keyValue}"`, (err : Error) =>{
                if(err) reject (err);
                resolve(true);
            })
        })
    }

    //The following are database methods that are directly useful for operations you may need to perform, such as adding a business, etc.

    /**
     * Given a business_id, retrieves that business's secret key
     * @param business_id - the unique primary key of the business you wish to retrieve the key from
     * @returns A promise for the string key
     */

    public getBusinessSecretKey(business_id : number): Promise<string>{
        return new Promise<string>( (resolve, reject)=>{
            this.get(`SELECT stripe_sk FROM ${Tables.business} t1 JOIN ${Tables.stripeKey} t2 ON t1.stripe_pk = t2.stripe_pk WHERE business_id=${business_id};`, (err: Error, data ) =>{
                if(err) reject(err);
                resolve(data.stripe_sk);
            })
        })
    }

    /**
     * Creates a business Row Object and inserts it into the database for you.
     * @param business_id - The primary key of the business you wish to create. Make sure it's unique!
     * @param stripe_pk - The stripe public key of the business. You can find this in the business' stripe dashboard
     * @param business_name  - The business name. Doesn't need to be unique (but should be? left this unconstrained to allow for resturaunt chains)
     * @returns A boolean promise to create the business.
     */

    public async createBusiness(business_id : number, stripe_pk : string, business_name : string): Promise<Boolean>{

        const row : Row.Business = {
            business_id: business_id,
            stripe_pk: stripe_pk,
            business_name: business_name
        }
        return await this.createRow(row);
    }

    /**
     * Gives a Row object given a business_id
     * @param business_id - The primary key of the business you wish to read
     * @returns a Promise for the Row.Business object representation of that business_id
     */

    public async readBusiness(business_id : number): Promise<Row.Business>{

        return await this.readRow(business_id, Tables.business) as Row.Business;
    }

    /**
     * Updates a currently existing business
     * @param business_id - The primary key of the business you wish to update.
     * @param stripe_pk (optional) - The new stripe public key of the business.
     * @param business_name (optional)  - The new business name.
     * @returns A promise to update the business
     * @throws a 'Update must contain an updated value' if both variables are left undefined / null.
     */

    public async updateBusiness(business_id : number, stripe_pk? : string | null, business_name? : string | null): Promise<Boolean>{

        let row : Row.Business = await this.readRow(business_id, Tables.business) as Row.Business;

        if( (!stripe_pk && !business_name) ) throw new Error('Update must contain an updated value');

        if(stripe_pk) row.stripe_pk = stripe_pk;
        if(business_name) row.business_name = business_name;

        return await this.updateRow(row);
    }

    /**
     * Deletes a business
     * @param business_id - The id of the business to be deleted
     * @returns a boolean Promise to delete the business
     */

    public async deleteBusiness(business_id : number): Promise<Boolean>{

        return await this.deleteRow(business_id, Tables.business);
    }

    /**
     * 
     * @param stripe_pk - The stripe public key to add
     * @param stripe_sk - the associated stripe private key
     * @returns A boolean promise to add these keys to the database
     */

    public async createStripeKeys(stripe_pk : string, stripe_sk : string): Promise<Boolean>{
        
        const row : Row.StripeKeys = {
            stripe_pk: stripe_pk,
            stripe_sk: stripe_sk
        }

        return await this.createRow(row);
    }

    /**
     * 
     * @param stripe_pk - The public key of the public-private key pair to delete from the database.
     * @returns  A boolean promise to delete the row
     */

    public async deleteStripeKeys(stripe_pk : string): Promise<Boolean>{

        return await this.deleteRow(stripe_pk, Tables.stripeKey);
    }

    

}

/**
 * The database client for access to the sqlite3 legacy database. Contains many helpful methods.
 */

export const db = new legacyDatabase();



