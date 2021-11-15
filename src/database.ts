/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Written by Cory Accardo, Github: Cory-Accardo, email: accardo@usc.edu
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

import { LegacyModel} from './utilities/types';
import mongoose from 'mongoose';
import Config from './utilities/models/config.model';
import path from 'path';

require('dotenv').config({ path: path.join(__dirname, '../', '.env')})

if( !("MONGO_URI" in process.env) ) throw Error("Environment file does not include: MONGO_URI");

const MONGO_URI = process.env.MONGO_URI as string;
mongoose.connect(MONGO_URI);
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection success")
})


/**
 * A database class with methods designed to be used with legacy businesses.
 */

class legacyDatabase{


    //Global config methods

    public async readConfig() : Promise <LegacyModel.Config>{

        return await Config.findOne({});
    }

    public async updateConfig(service_cut : number) : Promise <LegacyModel.Config>{

        return await Config.findOneAndUpdate({}, {service_cut: service_cut});
    }


    

}

/**
 * The database client for access to the mongo legacy database. Contains many helpful methods.
 */

export const db = new legacyDatabase();

