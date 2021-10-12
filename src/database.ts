import { sqlite3 } from "sqlite3";
import Stripe from "stripe";
import { Tables, Row, BusinessRow, StripeKeysRow, isBusinessRow, isStripeKeysRow} from './utilities/types';
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
    
    public formTables(){
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

    public deleteTables(){
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

    //The following are CRUD methods to safely modify the database without using SQL.
    //Please use these unless you know what you're doing.

     /**
     * Adds an entirely new row based on the table type passed in.
     * @returns A boolean Promise to add the row
     * @throws a rejection if the row was unable to add.
     */

    public createRow( row : Row){

        return new Promise<Boolean> ((resolve,reject) =>{
            
            if(isBusinessRow(row)){
                row = row as BusinessRow;
                const {business_id, stripe_pk, business_name} = row;
                this.run(`INSERT INTO ${Tables.business} VALUES(${business_id}, "${stripe_pk}","${business_name}");`, (err : Error) =>{
                    if(err) reject(err);
                    resolve(true);
                });
            }

            else if(isStripeKeysRow(row)){
                row = row as StripeKeysRow;
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

    public readRow(keyValue : number | string, table : Tables){

        return new Promise <Row> ( (resolve, reject) =>{
            this.get(`SELECT * FROM ${table} WHERE ${getPrimaryKey(table)}="${keyValue}";` , (err: Error, data : Row)=>{
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
    public updateRow( row : Row){

        return new Promise<Boolean> ((resolve,reject) =>{
            
            if(isBusinessRow(row)){
                row = row as BusinessRow;
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

    public deleteRow(keyValue : number | string, table : Tables){
        return new Promise<Boolean> ((resolve, reject) =>{
            this.run(`DELETE FROM ${table} WHERE ${getPrimaryKey(table)}="${keyValue}"`, (err : Error) =>{
                if(err) reject (err);
                resolve(true);
            })
        })
    }

    //The following are database methods that are directly useful for operations you may need to perform, such as adding a business, etc.

    public getBusinessSecretKey(business_id : number){
        return new Promise<string>( (resolve, reject)=>{
            this.get(`SELECT stripe_sk FROM ${Tables.business} t1 JOIN ${Tables.stripeKey} t2 ON t1.stripe_pk = t2.stripe_pk WHERE business_id=${business_id};`, (err: Error, data ) =>{
                if(err) reject(err);
                resolve(data.stripe_sk);
            })
        })
    }
    

}

export const db = new legacyDatabase();
