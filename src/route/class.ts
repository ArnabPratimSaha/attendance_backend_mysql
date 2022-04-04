
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

router.post('/student',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const name:string|undefined=req.body.name;
        const roll:string|undefined=req.body.roll;
        if( !name || !roll)return next(new CustomError('missing field name or roll',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const student=new StudentModel({
            id:uuidv4(),
            name:name,
            roll:roll,
            classId:req.classData.id,
            attendenceArray:new Array<boolean>(req.classData.AttendenceArray.length).fill(false),
            attendenceCount:0,
        });
        const classData=await ClassModel.findOne({id:req.classData.id});
        if(!classData)return next('No Class found');
        await student.save();
        classData.students.push(student.id);
        await classData.save();
        return res.status(200).json({ ...student.toObject(),accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})
router.patch('/student',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
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
router.delete('/student',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const id:string|undefined=req.body.id;
        if(!id)return next(new CustomError('missing field id',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const classData=await ClassModel.findOne({id:req.classData.id});
        if(!classData)return next('No Class found');
        const student=await StudentModel.findOneAndDelete({id:id});
        if(!student)return next(new CustomError('Student not found',404));
        classData.students=classData.students.filter(i=>i!==student.id);
        await classData.save();
        return res.status(200).json({ ...student.toObject(),accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})

router.post('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const time:Date|undefined=req.body.time?new Date(req.body.time):undefined;
        if(!time)return next(new CustomError('time is missing'));
        const classData=await ClassModel.findOne({id:req.classData?.id});
        if(!classData)return next(new CustomError('No Class found',404));
        classData.AttendenceArray.push(time);
        classData.AttendenceCount.push(0);
        const response=await StudentModel.updateMany({classId:classData.id},{ $push:{ attendenceArray: false }});
        if(!response.acknowledged)return next(new CustomError('Data is not ACK',500,false));
        await classData.save();
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
})
router.patch('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const index:number|undefined=(+req.body.index)||undefined;
        const studentId:string|undefined=req.body.sid;
        const remark:boolean|undefined=req.body.remark;
        console.log(index,studentId,remark);
        
        if(!index || !studentId  || remark===undefined)return next(new CustomError('index or sid or remark missing',400));
        const classData=await ClassModel.findOne({id:req.classData?.id});
        if(!classData)return next(new CustomError('No Class found',404));
        const student=await StudentModel.findOne({id:studentId,classId:classData.id});
        if(!student)return next(new CustomError('Student not found',404));
        const temp:boolean= student.attendenceArray[index];
        student.attendenceArray[index]=remark;
        if(remark!==temp){
            if(student.attendenceArray[index]){
                student.attendenceCount+=1;
                classData.AttendenceCount[index]+=1;
            }
            else {
                student.attendenceCount-=1;
                classData.AttendenceCount[index]-=1;
            }
        }
        await student.save();
        await classData.save();
        return res.status(200).json({accesstoken:req.accesstoken});
    } catch (error) {
        next(error);
    }
})
router.delete('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {

    } catch (error) {
        next(error);
    }
})

export default router;