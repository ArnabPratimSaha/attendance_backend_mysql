import express ,{NextFunction, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import bcrypt from 'bcrypt';
import { User } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import { ClassInterface } from '../database/class';
import MySqlConnection from '../database/config';


const router:Router=express.Router();

router.get('/',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try { 
        if(!req.user)return next(new CustomError('No User',404));
        return res.status(200).json({name:req.user.name,email:req.user.email,id:req.user.id ,accesstoken:req.accesstoken});
    } catch (error) {
        next(error);
    }
})
interface classResponseInterface{
    id:string,
    name:string,
    createdAt:string,
    teacher:string,
    studentCount:number,
    recordCount:number
}
router.get('/class',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User',404));
        const database=await MySqlConnection.build();
        const [row]=await database.connection.query(`
        select * from (select rec.id,c.name,c.createdAt,c.teacher,rec.studentCount,rec.recordCount from (select srec.id,srec.studentCount,rrec.recordCount from (select ifnull(srec.studentCount,0) as studentCount,srec.id from  (select * from class as c left join (select count(*) as studentCount,classId from student as s group by s.classId) as ns on c.id=ns.classId) as srec)
            as srec 
        inner join
        (select ifnull(rrec.recordCount,0) as recordCount,rrec.id from (select * from  class as c left join (select count(*) as recordCount,classId from  attendancerecord as ar group by ar.classId) as nr on c.id=nr.classId) as rrec) as rrec
        on srec.id=rrec.id) as rec
        inner join class as c where c.id=rec.id) as classinfo where classinfo.teacher='${req.user.id}';
        `);
        let classes:Array<classResponseInterface>=row as Array<classResponseInterface>;
        return res.status(200).json({classes,accesstoken:req.accesstoken});
    } catch (error) {
        next(error);
    }
})

export default router;