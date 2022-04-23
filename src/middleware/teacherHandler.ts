import { NextFunction } from "express";
import { User } from "../database/user";
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import jwt from 'jsonwebtoken';
import { CustomError } from "./errorHandler";
import { UserRequset } from "./userHandler";
import { ClassInterface } from "../database/class";
import MySqlConnection from "../database/config";
//this middleware required userHandler to run first
interface teacherRequest extends UserRequset{
    classData?:ClassInterface
}
const teacherHandler=async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User'));
        const classId:string|undefined=req.headers.classid?.toString().trim();
        if(!classId)return next(new CustomError('class id missing',400));
        const database=await MySqlConnection.build();
        const [row]=await database.connection.query(`select * from class as c where c.id='${classId}';`);
        const classes:Array<ClassInterface>=row as Array<ClassInterface>;
        if(!classes.length)return next(new CustomError('class Not found',404));
        if(classes[0].teacher!==req.user.id)return next(new CustomError('user does not have authorized to access the class',403));
        req.classData=classes[0];
        return next();
    } catch (error) {
        next(error);
    }
}
export {teacherHandler,teacherRequest}