
import express ,{NextFunction, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import { User, UserModel } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import { ClassModel } from '../database/class';
import { teacherRequest, teacherHandler } from '../middleware/teacherHandler';
import { StudentModel } from '../database/student';


const router:Router=express.Router();

router.post('/create',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User',404));
        const name:string|undefined=req.body.name;
        if(!name)return next(new CustomError('Class name field missing'));
        const newClass=new ClassModel({
            id:uuidv4(),
            name:name,
            teachers:[req.user.id],
            students:[],
            AttendenceArray:[],
            AttendenceCount:0
        })
        await newClass.save();
        return res.status(200).json({ ...newClass.toObject(),accesstoken:req.accesstoken });
    } catch (error) {
        next(error);
    }
})

router.post('/student',teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const name:string|undefined=req.body.name;
        const roll:string|undefined=req.body.roll;
        if( !name || !roll)return next(new CustomError('missing field name or roll',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const student=new StudentModel({
            id:uuidv4(),
            name:name,
            roll:roll,
            attendenceArray:new Array<boolean>(req.classData.AttendenceArray.length).fill(false),
            attendenceCount:0,
        });
        await student.save();
        return res.status(200).json({ ...student.toObject(),accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})
router.patch('/student',teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const name:string|undefined=req.body.name;
        const roll:string|undefined=req.body.roll;
        const id:string|undefined=req.body.id;
        if( !name || !roll ||  !id)return next(new CustomError('missing field name or roll or id',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const student=await StudentModel.findOne({id:id});
        if(!student)return next(new CustomError('Student not found',404));
        student.name=name;
        student.roll=roll;
        await student.save();
        return res.status(200).json({ ...student.toObject(),accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})
router.delete('/student',teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const id:string|undefined=req.body.id;
        if(!id)return next(new CustomError('missing field id',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const student=await StudentModel.findOneAndDelete({id:id});
        if(!student)return next(new CustomError('Student not found',404));
        return res.status(200).json({ ...student.toObject(),accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})


export default router;