import { NextFunction } from "express";
import { User } from "../database/user";
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import jwt from 'jsonwebtoken';
import { CustomError } from "./errorHandler";
import MySqlConnection from "../database/config";
import { RefreshtokenInterface } from "../database/refeshtoken";

interface UserRequset extends CustomRequest{
    user?:User,
    accesstoken?:string,
    refreshtoken?:string
}
const userHandler=async(req:UserRequset,res:CustomResponse,next:NextFunction):Promise<void>=>{
    try {
        try {
            if(!process.env.SECRET)return next(new CustomError('Could not find process.env.SECRET',500,false));
            if(!req.headers.accesstoken)return next(new CustomError('Could not find accesstoken',400));
            if(!req.headers.refreshtoken)return next(new CustomError('Could not find refreshtoken',400));
            if(!req.headers.id)return next(new CustomError('Could not find id',400));
            const accesstoken:string = req.headers.accesstoken.toString().trim();
            const decoded:String | jwt.JwtPayload = jwt.verify(accesstoken, process.env.SECRET);
            if(!decoded || decoded instanceof String) return next(new CustomError('empty accesstoken',400));
            const database=await MySqlConnection.build();
            const [rows]=await database.connection.query(`select * from user where user.id='${decoded.id}';`);
            const users:Array<User>=rows as Array<User>;
            if (!users.length) return next(new CustomError('No user found',404));
            req.accesstoken = accesstoken.toString();
            req.refreshtoken = req.headers.refreshtoken.toString();
            req.user = users[0];
            return next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {            
                //refreshing the access token
                try {
                    if (!process.env.SECRET) return next(new CustomError('Could not find process.env.SECRET', 500, false));
                    if (!req.headers.accesstoken) return next(new CustomError('Could not find accesstoken', 400));
                    if (!req.headers.refreshtoken) return next(new CustomError('Could not find refreshtoken', 400));
                    if (!req.headers.id) return next(new CustomError('Could not find id', 400));
                    if(!process.env.SECRET)return next(new CustomError('Could not find process.env.SECRET',500,false));
                    const refreshtoken:string = req.headers.refreshtoken.toString().trim();
                    const id:string = req.headers.id.toString();
                    const database=await MySqlConnection.build();
                    const [rows]=await database.connection.query(`select * from user where user.id='${id}';`);
                    const users:Array<User>=rows as Array<User>;
                    if (!users.length) return next(new CustomError('No user found',404));
                    const [rt]=await database.connection.query(`select * from refreshtoken as rt where rt.uid='${id}' and rt.token='${refreshtoken}' limit 1;`)
                    const token:Array<RefreshtokenInterface>=rt as Array<RefreshtokenInterface>;
                    if(!token.length)return next(new CustomError('Security breach',401));
                    req.accesstoken = jwt.sign({ id: users[0].id }, process.env.SECRET, { expiresIn: 60 });//1 min
                    req.user = users[0];
                    req.refreshtoken = req.headers.refreshtoken.toString();
                    return next();
                } catch (e) {
                    console.log(e);
                    return next(new CustomError('unknow error',500));
                }
            }
            if (error instanceof jwt.JsonWebTokenError) {
                //security breach(user used a malformed jwt)
                try {
                    return next(new CustomError('Security breach',401));
                } catch (e) {
                    console.log(e);
                    return next(new CustomError('unknow error',500));
                }
            }
            console.log(error);
            return next(new CustomError('unknow error',500));
        }
    } catch (error) {
        next(error);
    }
}
export {userHandler,UserRequset }