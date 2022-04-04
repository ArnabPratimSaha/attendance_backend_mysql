import { NextFunction } from "express";
import { User, UserModel } from "../database/user";
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import jwt from 'jsonwebtoken';
import { CustomError } from "./errorHandler";

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
            if(!decoded || decoded instanceof String) return next(new CustomError('empty accesstoken',400))
            const user = await UserModel.findOne({ id: decoded.id});
            if (!user) return next(new CustomError('No user found',404));
            req.accesstoken = accesstoken.toString();
            req.refreshtoken = req.headers.refreshtoken.toString();
            req.user = user;
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
                    const user = await UserModel.findOne({ id: id });
                    if (!user) return next(new CustomError('No user found',404));
                    if (user.refreshtoken.includes(refreshtoken.toString())) {
                        req.accesstoken = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: 60 });//1 min
                        req.user = user;
                        req.refreshtoken = req.headers.refreshtoken.toString();
                        return next();
                    }
                    //user does not have refresh token or have a wrong refresh token
                    // user.refreshtoken = [];
                    // await user.save();
                    return next(new CustomError('Security breach',401));
                } catch (e) {
                    console.log(e);
                    return next(new CustomError('unknow error',500));
                }
            }
            if (error instanceof jwt.JsonWebTokenError) {
                //security breach(user used a malformed jwt)
                try {
                    if (!req.headers.id) return next(new CustomError('Could not find id', 400));
                    const id:string = req.headers.id.toString();
                    const user = await UserModel.findOne({ id: id });
                    if (!user) return next(new CustomError('No user found',404));
                    // user.refreshtoken = [];
                    // await user.save();
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