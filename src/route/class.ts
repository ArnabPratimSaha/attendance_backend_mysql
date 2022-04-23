
import express ,{NextFunction,Request,Response, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import { User } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import { ClassInterface } from '../database/class';
import { teacherRequest, teacherHandler } from '../middleware/teacherHandler';
import { Student } from '../database/student';
import MySqlConnection from '../database/config';
import { getCustomid } from '../customs/uuid';
import { classCreatingError } from '../middleware/classCreatingError';
import { AttendanceRecord } from '../database/attendancerecord';


const router:Router=express.Router();

router.post('/',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User',404));
        const name:string|undefined=req.body.name;
        if(!name)return next(new CustomError('Class name field missing'));
        const database=await MySqlConnection.build();
        const myClass:ClassInterface={
            id:getCustomid(),
            name,createdAt:new Date().toISOString().slice(0, 19).replace('T', ' '),
            teacher:req.user.id
        }
        res.locals.classId=myClass.id;
        await database.connection.query(`insert into class(id,name,createdAt,teacher) values('${myClass.id}','${myClass.name}','${myClass.createdAt}','${myClass.teacher}') ;`);
        await database.connection.query(`create table ${myClass.id}_record (id varchar(255) primary key,sid varchar(255) not null,cid varchar(255) not null ,rid varchar(255) not null,foreign key(rid) references attendancerecord(id) on delete cascade,foreign key(cid) references class(id) on delete cascade,foreign key(sid) references student(id) on delete cascade );`)
        return res.status(200).json({ ...myClass,accesstoken:req.accesstoken });
    } catch (error) {
        next(error);
    }
},classCreatingError)

router.post('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const time:Date|undefined=req.body.time?new Date(req.body.time):undefined;
        if(!time)return next(new CustomError('time is missing'));
        if(!req.classData)return next(new CustomError('class not found',400));
        const database=await MySqlConnection.build();
        await database.connection.query(`insert into attendancerecord(id,classId,timestamp) value ('${uuidv4()}','${req.classData.id}','${time.toISOString().slice(0, 19).replace('T', ' ')}');`);
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
})
router.patch('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const recordId:string|undefined=req.body.rid;
        const studentId:string|undefined=req.body.sid;
        if(req.body.remark===undefined)return next(new CustomError('remark missing',400));
        const remark:boolean=Boolean(req.body.remark);  
        if(!recordId||!studentId)return next(new CustomError('rid or sid not found',400));
        if(!req.classData)return next(new CustomError('class not found',400));
        const database=await MySqlConnection.build();
        
        const [row]=await database.connection.query(`select * from student as s where s.id='${studentId}';`);
        const students:Array<Student>=row as Array<Student>;
        if(!students.length)return next(new CustomError('student not found'));
        const [r]=await database.connection.query(`select * from attendancerecord as r where r.id='${recordId}';`);
        const attendancerecord:Array<AttendanceRecord>=row as Array<AttendanceRecord>;
        if(!attendancerecord)return next(new CustomError('attendance column not found',404));
        if(remark){
            await database.connection.query(`delete from ${req.classData.id}_record as r where r.sid='${studentId}' and r.rid='${recordId}' ;`);
            await database.connection.query(`insert into ${req.classData.id}_record(id,sid,cid,rid) values ('${uuidv4()}','${studentId}','${req.classData.id}','${recordId}');`);
        }
        else
            await database.connection.query(`delete from ${req.classData.id}_record as r where r.sid='${studentId}' and r.rid='${recordId}' ;`);
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});
router.delete('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const recordId:string|undefined=req.body.rid;
        if(!recordId)return next(new CustomError('rid not found',400));
        if(!req.classData)return next(new CustomError('class not found',400));
        const database=await MySqlConnection.build();
        await database.connection.query(`delete from attendancerecord as r where r.id='${recordId}';`)
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
})
interface StudentAttendanceInterface{
    name:string,
    studentId:string,
    roll:string,
    recordId:string,
    attendanceId:string,
    timestamp:string
}
router.get('/',async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const classId:string|undefined=req.query.cid?.toString();
        if(!classId)return next(new CustomError('Class id missing'));
        const database=await MySqlConnection.build();
        const [row]=await database.connection.query(`select * from class as c where c.id='${classId}';`);
        const classes:Array<ClassInterface>=row as Array<ClassInterface>;
        if(!classes.length)return next(new CustomError('Class not found',404));
        const [stu]=await database.connection.query(`select * from student as s where s.classId='${classId}'`);
        const students:Array<Student>=stu as Array<Student>;
        const [rec]=await database.connection.query(`select * from attendancerecord as ar where ar.classId='${classId}' order by ar.timestamp asc`);
        const attendanceRecords:Array<AttendanceRecord>=rec as Array<AttendanceRecord>;
        const [stur]=await database.connection.query(`
            select stu.id as studentId,stu.name,stu.roll,ar.id as recordId,sr.id as attendanceId,ar.timestamp from (
                select * from  attendancerecord as ar where ar.classId='${classId}'
            )as ar
            left join ${classId}_record as sr on sr.rid=ar.id
            right join (select * from student as stu 
            where stu.classId='${classId}') as stu on stu.id=sr.sid;
        `);
        const studentData:Array<StudentAttendanceInterface>=stur  as Array<StudentAttendanceInterface>;
        let studentMatrix:Array<Array<boolean>>=students.map(s=>new Array<boolean>(attendanceRecords.length).fill(false));
        const attendanceIdArray:Array<string>=attendanceRecords.map(ar=>ar.id);
        const studentIdArray:Array<string>=students.map(s=>s.id);
        studentData.forEach((sd)=>{
            const rid=attendanceIdArray.indexOf(sd.recordId);
            const sid=studentIdArray.indexOf(sd.studentId);
            studentMatrix[sid][rid]=true;
        })
        return res.status(200).json({attendanceRecords,students,studentMatrix});
    } catch (error) {
        next(error);
    }
})
router.delete('/',userHandler,async(req:UserRequset,res:Response,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No user found'));
        const id:string|undefined=req.body.id;
        if(!id)return next(new CustomError('no id found',400));
        const database=await MySqlConnection.build();
        const [row]=await database.connection.query(`select * from class as c where c.id='${id}' and teacher='${req.user.id}';`);
        res.locals.classId=id;
        const classes:Array<ClassInterface>=row as Array<ClassInterface>;
        if(classes.length){
            await database.connection.query(`delete from class as c where c.id='${id}';`);
            await database.connection.query(`drop table ${id}_record;`);
            return res.sendStatus(200);
        }
        return res.status(404).json('class not found');
    } catch (error) {
        next(error);
    }
},classCreatingError)

export default router;