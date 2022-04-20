// import express ,{NextFunction,Request,Response, Router}from 'express';
// import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
// import { User, UserModel } from '../database/user';
// import { v4 as uuidv4 } from 'uuid';
// import { userHandler, UserRequset } from '../middleware/userHandler';
// import { CustomError } from '../middleware/errorHandler';
// import { ClassModel } from '../database/class';
// import { teacherRequest, teacherHandler } from '../middleware/teacherHandler';
// import { StudentModel } from '../database/student';


// const router:Router=express.Router();

// router.get('/',async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
//     try {
//         const id:string|undefined=req.query.id?.toString().trim();
//         const cid:string|undefined=req.query.cid?.toString().trim();
//         if(!id || !cid)return next(new CustomError('cid or id missing',400));
//         const student=await StudentModel.findOne({id:id},'-_id -__v');
//         const classData=await ClassModel.findOne({id:cid},'-_id -__v');
//         if(!student)return next(new CustomError('Student not found',404));
//         if(!classData)return next(new CustomError('Class not found',404));
//         res.status(200).json({ ...student.toObject(),attendenceDate:classData.attendanceArray,teachers:classData.teachers });
//     } catch (error) {
//         next(error);
//     }
// })
// router.patch('/',userHandler,teacherHandler,async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
//     try {
//         const id:string|undefined=req.body.id?.trim();
//         const name:string|undefined=req.body.name?.toString().trim();
//         const roll:string|undefined=req.body.roll?.toString().trim();
//         if(!id||!name||!roll)return next(new CustomError('id roll roll missing',400));
//         const student=await StudentModel.findOneAndUpdate({id:id},{$set:{name:name ,roll:roll} });
//         if(!student)return next(new CustomError('Student not found',404));
//         return res.sendStatus(200);
//     } catch (error) {
//         next(error);
//     }
// })
// router.delete('/',userHandler,teacherHandler,async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
//     try {
//         const id:string|undefined=req.body.id?.trim();
//         if(!id)return next(new CustomError('id missing',400));
//         const student=await StudentModel.findOneAndDelete({id:id});
//         if(!student)return next(new CustomError('Student not found',404));
//         const classData=await ClassModel.findOneAndUpdate({id:student.classId},{ $pull :{students:student.id }})
//         return res.sendStatus(200);
//     } catch (error) {
//         next(error);
//     }
// })

// export default router;