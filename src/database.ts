import { sqlite3 } from "sqlite3";
import { BusinessRow, ProductsRow, StripeKeysRow } from './utilities/types';

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
     */
    
    formTables(){
        this.run('CREATE TABLE business (business_id INTEGER PRIMARY KEY, stripe_pk TEXT NOT NULL UNIQUE, business_name TEXT NOT NULL);')
        this.run('CREATE TABLE products (product_id INTEGER PRIAMRY KEY, business_id INTEGER NOT NULL UNIQUE, stripe_product BLOB NOT NULL);')
        this.run('CREATE TABLE stripe_keys (stripe_pk TEXT PRIMARY KEY, stripe_sk TEXT NOT NULL UNIQUE);')
    }

    addBusiness( {business_id, stripe_pk, business_name} : BusinessRow){
        console.log(`INSERT INTO business VALUES (${business_id}, "${stripe_pk}", "${business_name}");`)
        this.run(`INSERT INTO business VALUES(${business_id}, "${stripe_pk}" , "${business_name}");`)
    }
    readBusinessRow(business_id : number){
        return new Promise <BusinessRow> ( (resolve, reject) =>{
            this.get(`SELECT * FROM business WHERE business_id=${business_id};` , (err, data)=>{
                if(err) reject(err);
                resolve(data);
            })
        })
    }
    

}

let db = new legacyDatabase();

//     db.formTables();

//   db.addBusiness({
//       business_id: 50,
//       stripe_pk: "34534",
//       business_name: "Rockaround"
//   })

db.readBusinessRow(50).then( (row) =>{
    console.log(row);
})

