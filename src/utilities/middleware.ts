import express from 'express';
import crypto from 'crypto';


export const isAuthorized = (req: express.Request, res : express.Response, next : express.NextFunction) => {
    if( ! ("password" in req.body) ) return res.status(401).json("Not Authorized"); 
    const hashed = crypto.createHash('sha256').update(req.body.password).digest('base64');
    if(hashed != process.env.ADMIN_PASS) return res.status(401).json("Not Authorized");
    next()
  }