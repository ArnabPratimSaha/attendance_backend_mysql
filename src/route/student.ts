import express ,{NextFunction,Request,Response, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import { v4 as uuidv4 } from 'uuid';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import { teacherRequest, teacherHandler } from '../middleware/teacherHandler';
import MySqlConnection from '../database/config';
import { Student } from '../database/student';
import { ClassInterface } from '../database/class';


const router:Router=express.Router();
router.post('/',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const name:string|undefined=req.body.name;
        const roll:string|undefined=req.body.roll;
        if( !name || !roll)return next(new CustomError('missing field name or roll',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const database=await MySqlConnection.build();
        const student:Student={
            id:uuidv4(),
            name:name,
            roll:roll,
            classId:req.classData.id,
        }
        await database.connection.query(`insert into student(id,name,roll,classId) values('${student.id}','${student.name}','${student.roll}','${student.classId}');`)
        return res.status(200).json({ ...student,accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})
interface studentInformation{
    id:string,
    timestamp:string,
    remark:boolean
}
router.get('/',async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const id:string|undefined=req.query.id?.toString().trim();
        const cid:string|undefined=req.query.cid?.toString().trim();
        if(!id || !cid)return next(new CustomError('cid or id missing',400));
        const database=await MySqlConnection.build();
        const [c]=await database.connection.query(`select * from class as c where c.id='${cid}';`);
        const classes:Array<ClassInterface>=c as Array<ClassInterface>;
        if(!classes.length)return next(new CustomError(`class not found`,404));
        const [s]=await database.connection.query(`select * from student as s where s.id='${id}';`);
        const students:Array<Student>=s as Array<Student>;
        if(!students.length)return next(new CustomError('student not found',404));
        const [row]=await database.connection.query(`
        select * from  (select ar.id,ar.timestamp,case ifnull(res.id,'0') when '0' then false else true end as remark from  attendancerecord as ar 
            left join
        (select sr.id,sr.rid,sr.cid from  ${cid}_record as sr where sr.sid='${id}')as res 
            on res.rid=ar.id) as rec order by rec.timestamp desc
        ;`);
        const studentInfo:Array<studentInformation>=row as Array<studentInformation>;
        res.status(200).json({teacher:classes[0].teacher,...students[0],attendance:studentInfo});
    } catch (error) {
        next(error);
    }
})
router.patch('/',userHandler,teacherHandler,async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const id:string|undefined=req.body.id?.trim();
        const name:string|undefined=req.body.name?.toString().trim();
        const roll:string|undefined=req.body.roll?.toString().trim();
        const database=await MySqlConnection.build();
        await database.connection.query(`update student as s set s.name='${name}',s.roll='${roll}' where s.id='${id}';`);
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
})
router.delete('/',userHandler,teacherHandler,async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const id:string|undefined=req.body.id?.trim();
        if(!id)return next(new CustomError('id missing',400));
        const database=await MySqlConnection.build();
        await database.connection.query(`delete from student as s where s.id='${id}';`);
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
})

export default router;