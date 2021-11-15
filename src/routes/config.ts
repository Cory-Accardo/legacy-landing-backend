import { LegacyModel } from "../utilities/types";
import { isAuthorized } from "../utilities/middleware";
import { db } from "../database";
import express from 'express';

const router = express.Router();
router.use(express.json(), isAuthorized);


router.get('/read',  async (req, res) =>{

    try{

      return res.status(200).json(await db.readConfig());

    }
    catch(error : any){

      return res.status(500).json(error); //Indicates some unhandled error
  
    }
  })

router.put('/update',  async (req, res) => {

    try{

        if(!LegacyModel.isConfig(req.body))  return res.status(400).json("Request body does not meet specifications of @types/LegacyModel.Business");
        const { service_cut } = req.body as LegacyModel.Config;
        await db.updateConfig(service_cut);
        return res.status(200).json("Success");
  
      }
      catch(error : any){
  
        return res.status(500).json(error); //Indicates some unhandled error
    
      }
    
})

export default router;
