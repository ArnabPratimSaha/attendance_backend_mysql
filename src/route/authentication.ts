import express ,{NextFunction, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import bcrypt from 'bcrypt';
import { User } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import MySqlConnection from '../database/config';
import {ResultSetHeader} from 'mysql2';

const router:Router=express.Router();
const saltRound:number=10;

router.post('/signup',async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const name: string|undefined=req.body.name;
        const email: string|undefined=req.body.email;
        const password:string|undefined=req.body.password;
        if (!process.env.SECRET)return next(new CustomError('server error',500));
        if( !name || !email || !password){
            return next( new CustomError( `Missing fields [name,email,password]`,400));
        }
        const database=await MySqlConnection.build();
        const [rows]=await database.connection.query(`select * from user where user.email='${email}';`);
        const users:Array<User>=rows as Array<User>;
        if(users.length)return next(new CustomError(`User already exist`,400));
        const salt=await bcrypt.genSalt(saltRound);
        const hash=await bcrypt.hash(password,salt);
        const user:User={
            id:uuidv4(),
            password:hash,
            email,name
        }
        const accesstoken = jwt.sign({ id: user.id }, process.env.SECRET,{ expiresIn:  60});//1 min 
        const refreshtoken=jwt.sign({ id: user.id }, process.env.SECRET,{expiresIn:'1y'});
        await database.connection.query(`insert into user(id,name,email,password) values('${user.id}','${user.name}','${user.email}','${user.password}' );`);
        await database.connection.query(`insert into refreshtoken(uid,token) values ('${user.id}','${refreshtoken}')`);
        return res.status(200).json({accesstoken,refreshtoken,id:user.id,name:user.name,email:user.email});
    } catch (error) {
        return next(error);
    }
})

router.post('/login',async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const email: string|undefined=req.body.email;
        const password:string|undefined=req.body.password;
        if (!process.env.SECRET)return next(new CustomError('server error',500));
        if(!email || !password)return next(new CustomError('missing fields [email,password]',400));
        const database=await MySqlConnection.build();
        const [rows]=await database.connection.query(`select * from user where user.email='${email}';`);
        const users:Array<User>=rows as Array<User>;
        if(!users.length)return next(new CustomError('user not found',404));
        const isSame:boolean=await bcrypt.compare(password,users[0].password);
        if(!isSame)return next(new CustomError('Credentials invalid',403));
        const accesstoken = jwt.sign({ id: users[0].id }, process.env.SECRET,{ expiresIn:  60});//1 min 
        const refreshtoken=jwt.sign({ id: users[0].id }, process.env.SECRET,{expiresIn:'1y'});
        await database.connection.query(`insert into refreshtoken(uid,token) values ('${users[0].id}','${refreshtoken}')`);
        return res.status(200).json({ accesstoken, refreshtoken, id: users[0].id,name:users[0].name,email});
    } catch (error) {
        return next(error);
    }
});
router.delete('/logout',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User',404));
        const database=await MySqlConnection.build();
        const [rows]=await database.connection.query(`delete from refreshtoken as rt where rt.token='${req.refreshtoken}';`);
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export default router;