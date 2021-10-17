/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Written by Cory Accardo, Github: Cory-Accardo, email: accardo@usc.edu
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

import { sqlite3 } from "sqlite3";
import { Tables, Row} from './utilities/types';
import Cryptr from "cryptr";
require('dotenv').config({ path: '../.env' })

if( !("STRIPE_RK_ENCRYPTION" in process.env) ) throw Error("Environment file does not include: STRIPE_RK_ENCRYPTION");

const cryptr = new Cryptr(process.env.STRIPE_RK_ENCRYPTION as string);

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
     * Forms original legacy table from scratch.
     * @returns A boolean Promise to form these tables
     * @throws a rejection if db received an error.
     */
    
    private formLegacyTable(): Promise<Boolean>{
        return new Promise<Boolean> ((resolve, reject) =>{
        this.run(`CREATE TABLE ${Tables.Name.business} (business_id INTEGER PRIMARY KEY, stripe_rk TEXT NOT NULL UNIQUE, business_name TEXT NOT NULL);`, (err: Error) =>{
            if(err) reject(err);
            resolve(true);
            })
        })
    }

    /**
     * Deletes specified table in the database
     * @returns A boolean Promise to delete this table tables
     * @throws a rejection if the deletion formed an error.
     */

    private deleteTable(table : string): Promise<Boolean>{
        return new Promise<Boolean> ((resolve, reject) =>{
        this.run(`DROP TABLE ${table};`, (err: Error) =>{
            if(err) reject(err);
            resolve(true);
            })
        })
    }

    //The following are internal CRUD methods to safely modify the database without using SQL.
    //Please do not use these directly unless you know what you're doing.

     /**
     * Adds an entirely new row based on the table type passed in.
     * @returns A boolean Promise to add the row
     * @throws a rejection if the row was unable to add.
     */

    private createRow( row : Row.Generic, table : Tables.Name ): Promise<Boolean>{

        return new Promise<Boolean> ((resolve,reject) =>{
            if(table == Tables.Name.business){
                row = row as Row.Business;
                const {business_id, stripe_rk, business_name} = row;
                this.run(`INSERT INTO ${Tables.Name.business} VALUES(${business_id}, "${stripe_rk}","${business_name}");`, (err : Error) =>{
                    if(err) reject(err);
                    resolve(true);
                });
            }
            else{
                reject(`Create for ${table} is not implemented`);
            }
        })
    }

    /**
     * Reads a given row and returns an object representation of that data.
     * @param keyValue The value of the primary key of the row to be read
     * @param table  The table of the row to be read
     * @returns Promise for a Row type
     */

    private readRow(keyValue : number | string, table : Tables.Name): Promise<Row.Generic>{

        return new Promise <Row.Generic> ( (resolve, reject) =>{
            this.get(`SELECT * FROM ${table} WHERE ${Tables.getPrimaryKeyOf(table)}="${keyValue}";` , (err: Error, data : Row.Generic)=>{
                if(err) reject(err);
                resolve(data);
            })
        })
    }

    /**
     * Updates a row 
     * @param row - The row object that you wish to replace the current one with. Ensure that it contains the same primary key value!
     * @param table - a Table enum that specifies the table to be updated. If you add more tables, you must create your own SQL logic for it.
     * @returns A promise to update the replace a given row with the new row object
     */
    private updateRow( row : Row.Generic, table : Tables.Name): Promise<Boolean>{

        return new Promise<Boolean> ((resolve,reject) =>{
            
            if(table == Tables.Name.business){
                row = row as Row.Business;
                const {business_id, stripe_rk, business_name} = row;
                this.run(`UPDATE ${Tables.Name.business} SET stripe_rk='${stripe_rk}', business_name="${business_name}" WHERE business_id=${business_id};`, (err : Error) =>{
                    if(err) reject(err);
                    resolve(true);
                });
            }

            else{
                reject(`Update for ${table} is not implemented`);
            }

        })
    }

    /**
     * Deletes a row
     * @param keyValue The value of the primary key to be deleted
     * @param table The table to delete the row from
     * @returns a Promise to deltre the row.
     */

    private deleteRow(keyValue : number | string, table : Tables.Name): Promise<Boolean>{
        return new Promise<Boolean> ((resolve, reject) =>{
            this.run(`DELETE FROM ${table} WHERE ${Tables.getPrimaryKeyOf(table)}="${keyValue}"`, (err : Error) =>{
                if(err) reject (err);
                resolve(true);
            })
        })
    }

    //The following are database methods that are directly useful for operations you may need to perform, such as adding a business, etc.

    /**
     * Ensures the creation of a clean database file, deleting all other tables on the database and recreating the one defined in formLegacyTable()
     * @returns A boolean promise to clean the refresh the database.
     */

    public async refreshDatabaseToDefault(): Promise<Boolean>{

        interface Table { name: string } // This is the table object returned from sqlite3 query.
        const tables : Array<Table> = await new Promise( (resolve, reject) =>{  
            this.all("select name from sqlite_master where type='table'", (err: Error, data : Array<Table>) => {
                if(err) reject(err);
                resolve(data);
            });
        })

        for(const table of tables) await this.deleteTable(table.name);
        return await this.formLegacyTable();

    }

    /**
     * Creates a business Row Object and inserts it into the database for you.
     * @param business_id - The primary key of the business you wish to create. Make sure it's unique!
     * @param stripe_rk - The stripe restricted key of the business. You can find this in the business' stripe dashboard
     * @param business_name  - The business name. Doesn't need to be unique (but should be? left this unconstrained to allow for resturaunt chains)
     * @returns A boolean promise to create the business.
     */

    public async createBusiness(business_id : number, stripe_rk : string, business_name : string): Promise<Boolean>{

        const row : Row.Business = {
            business_id: business_id,
            stripe_rk: cryptr.encrypt(stripe_rk),
            business_name: business_name
        }
        return await this.createRow(row, Tables.Name.business);
    }

    /**
     * Gives a Row object given a business_id. Note: Does not decrypt the stripe_rk. Please use the getBusinessRestrictedKey method.
     * @param business_id - The primary key of the business you wish to read
     * @returns a Promise for the Row.Business object representation of that business_id
     */

    public async readBusiness(business_id : number): Promise<Row.Business>{

        return await this.readRow(business_id, Tables.Name.business) as Row.Business;
    }

    /**
     * Updates a currently existing business
     * @param business_id - The primary key of the business you wish to update.
     * @param stripe_rk (optional) - The new stripe restricted key of the business.
     * @param business_name (optional)  - The new business name.
     * @returns A promise to update the business
     * @throws a 'Update must contain an updated value' if both variables are left undefined / null.
     */

    public async updateBusiness(business_id : number, stripe_rk? : string | null, business_name? : string | null): Promise<Boolean>{

        let row : Row.Business = await this.readRow(business_id, Tables.Name.business) as Row.Business;

        if( (!stripe_rk && !business_name) ) throw new Error('Update must contain an updated value');

        if(stripe_rk) row.stripe_rk = cryptr.encrypt(stripe_rk);
        if(business_name) row.business_name = business_name;

        return await this.updateRow(row, Tables.Name.business);
    }

    /**
     * Deletes a business
     * @param business_id - The id of the business to be deleted
     * @returns a boolean Promise to delete the business
     */

    public async deleteBusiness(business_id : number): Promise<Boolean>{

        return await this.deleteRow(business_id, Tables.Name.business);
    }


    /**
     * Given a business_id, retrieves that business's restricted key
     * @param business_id - the unique primary key of the business you wish to retrieve the key from
     * @returns A promise for the string key
     */


    public getBusinessRestrictedKey(business_id : number): Promise<string>{
        return new Promise<string>( (resolve, reject)=>{
            this.get(`SELECT stripe_rk FROM ${Tables.Name.business} WHERE business_id=${business_id};`, (err: Error, data ) =>{
                if(err) reject(err);
                resolve(cryptr.decrypt(data.stripe_rk)); //Ensures that stripe key is decrypted.
            })
        })
    }

    

}

/**
 * The database client for access to the sqlite3 legacy database. Contains many helpful methods.
 */

export const db = new legacyDatabase();

