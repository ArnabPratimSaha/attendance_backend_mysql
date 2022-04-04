import { NextFunction } from "express";
import { User, UserModel } from "../database/user";
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import jwt from 'jsonwebtoken';
import { CustomError } from "./errorHandler";
import { UserRequset } from "./userHandler";
import { AClass, ClassModel } from "../database/class";
//this middleware required userHandler to run first
interface teacherRequest extends UserRequset{
    classData?:AClass
}
const teacherHandler=async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User'));
        const classId:string|undefined=req.headers.classid?.toString().trim();
        if(!classId)return next(new CustomError('class id missing',400));
        const classData=await ClassModel.findOne({id:classId});
        if(!classData)return next(new CustomError('class Not found',404));
        const id=req.user.id;
        if(!classData.teachers.find(c=>c===id) )return next(new CustomError('user does not have authorized to access the class',403));
        req.classData=classData;
        return next();
    } catch (error) {
        next(error);
    }
}
export {teacherHandler,teacherRequest}