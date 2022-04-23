import express ,{NextFunction, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import bcrypt from 'bcrypt';
import { User } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import { ClassInterface } from '../database/class';
import MySqlConnection from '../database/config';


const router:Router=express.Router();

router.get('/',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try { 
        if(!req.user)return next(new CustomError('No User',404));
        return res.status(200).json({name:req.user.name,email:req.user.email,id:req.user.id ,accesstoken:req.accesstoken});
    } catch (error) {
        next(error);
    }
})
router.get('/class',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User',404));
        const database=await MySqlConnection.build();
        const [row]=await database.connection.query(`select * from class as c where c.teacher='${req.user.id}';`);
        let classes:Array<ClassInterface>=row as Array<ClassInterface>;
        return res.status(200).json({classes,accesstoken:req.accesstoken});
    } catch (error) {
        next(error);
    }
})

export default router;