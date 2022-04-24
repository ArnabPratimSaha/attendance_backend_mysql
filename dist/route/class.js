"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const userHandler_1 = require("../middleware/userHandler");
const errorHandler_1 = require("../middleware/errorHandler");
const teacherHandler_1 = require("../middleware/teacherHandler");
const config_1 = __importDefault(require("../database/config"));
const uuid_2 = require("../customs/uuid");
const classCreatingError_1 = require("../middleware/classCreatingError");
const router = express_1.default.Router();
router.post('/', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User', 404));
        const name = req.body.name;
        if (!name)
            return next(new errorHandler_1.CustomError('Class name field missing'));
        const database = yield config_1.default.build();
        const myClass = {
            id: (0, uuid_2.getCustomid)(),
            name, createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            teacher: req.user.id
        };
        res.locals.classId = myClass.id;
        yield database.connection.query(`insert into class(id,name,createdAt,teacher) values('${myClass.id}','${myClass.name}','${myClass.createdAt}','${myClass.teacher}') ;`);
        yield database.connection.query(`create table ${myClass.id}_record (id varchar(255) primary key,sid varchar(255) not null,cid varchar(255) not null ,rid varchar(255) not null,foreign key(rid) references attendancerecord(id) on delete cascade,foreign key(cid) references class(id) on delete cascade,foreign key(sid) references student(id) on delete cascade );`);
        return res.status(200).json(Object.assign(Object.assign({}, myClass), { accesstoken: req.accesstoken }));
    }
    catch (error) {
        next(error);
    }
}), classCreatingError_1.classCreatingError);
router.get('/col', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const rid = (_a = req.query.rid) === null || _a === void 0 ? void 0 : _a.toString();
        const classsId = (_b = req.query.cid) === null || _b === void 0 ? void 0 : _b.toString();
        if (!classsId || !rid)
            return next(new errorHandler_1.CustomError('cid or rid missing', 400));
        const database = yield config_1.default.build();
        const [c] = yield database.connection.query(`select * from class as c where c.id='${classsId}';`);
        const classses = c;
        if (!classses.length)
            return next(new errorHandler_1.CustomError('class not found', 404));
        const [da] = yield database.connection.query(`select * from  attendancerecord as ar where ar.id='${rid}';`);
        const attendance = da;
        if (!attendance.length)
            return next(new errorHandler_1.CustomError('attendance id not found', 404));
        const [rw] = yield database.connection.query(`select s.name,s.id,s.roll,nw.sid as presentId from (select * from  student as s where s.classId='${classsId}') as s left join 
        (select * from (select sr.sid from ${classsId}_record as sr where sr.rid='${rid}') as wn) as nw on nw.sid=s.id;`);
        const data = rw;
        const stuData = data.map(d => {
            const da = {
                id: d.id, name: d.name, remark: d.presentId ? true : false,
                roll: d.roll
            };
            return da;
        });
        const resData = {
            id: classses[0].id, name: classses[0].name,
            teacher: classses[0].teacher, students: stuData,
            date: new Date(attendance[0].timestamp)
        };
        return res.status(200).json(Object.assign({}, resData));
    }
    catch (error) {
        next(error);
    }
}));
router.post('/col', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const time = req.body.time ? new Date(req.body.time) : undefined;
        if (!time)
            return next(new errorHandler_1.CustomError('time is missing'));
        if (!req.classData)
            return next(new errorHandler_1.CustomError('class not found', 400));
        const database = yield config_1.default.build();
        yield database.connection.query(`insert into attendancerecord(id,classId,timestamp) value ('${(0, uuid_1.v4)()}','${req.classData.id}','${time.toISOString().slice(0, 19).replace('T', ' ')}');`);
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
router.patch('/col', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recordId = req.body.rid;
        const studentId = req.body.sid;
        if (req.body.remark === undefined)
            return next(new errorHandler_1.CustomError('remark missing', 400));
        const remark = Boolean(req.body.remark);
        if (!recordId || !studentId)
            return next(new errorHandler_1.CustomError('rid or sid not found', 400));
        if (!req.classData)
            return next(new errorHandler_1.CustomError('class not found', 400));
        const database = yield config_1.default.build();
        const [row] = yield database.connection.query(`select * from student as s where s.id='${studentId}';`);
        const students = row;
        if (!students.length)
            return next(new errorHandler_1.CustomError('student not found'));
        const [r] = yield database.connection.query(`select * from attendancerecord as r where r.id='${recordId}';`);
        const attendancerecord = row;
        if (!attendancerecord)
            return next(new errorHandler_1.CustomError('attendance column not found', 404));
        if (remark) {
            yield database.connection.query(`delete from ${req.classData.id}_record as r where r.sid='${studentId}' and r.rid='${recordId}' ;`);
            yield database.connection.query(`insert into ${req.classData.id}_record(id,sid,cid,rid) values ('${(0, uuid_1.v4)()}','${studentId}','${req.classData.id}','${recordId}');`);
        }
        else
            yield database.connection.query(`delete from ${req.classData.id}_record as r where r.sid='${studentId}' and r.rid='${recordId}' ;`);
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
router.delete('/col', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recordId = req.body.rid;
        if (!recordId)
            return next(new errorHandler_1.CustomError('rid not found', 400));
        if (!req.classData)
            return next(new errorHandler_1.CustomError('class not found', 400));
        const database = yield config_1.default.build();
        yield database.connection.query(`delete from attendancerecord as r where r.id='${recordId}';`);
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const classId = (_c = req.query.cid) === null || _c === void 0 ? void 0 : _c.toString().trim();
        if (!classId)
            return next(new errorHandler_1.CustomError('Class id missing'));
        const database = yield config_1.default.build();
        const [row] = yield database.connection.query(`select * from class as c where c.id='${classId}';`);
        const classes = row;
        if (!classes.length)
            return next(new errorHandler_1.CustomError('Class not found', 404));
        const [stu] = yield database.connection.query(`select * from student as s where s.classId='${classId}'`);
        const students = stu;
        const [rec] = yield database.connection.query(`select * from attendancerecord as ar where ar.classId='${classId}' order by ar.timestamp asc`);
        const attendanceRecords = rec;
        const [stur] = yield database.connection.query(`
            select stu.id as studentId,stu.name,stu.roll,ar.id as recordId,sr.id as attendanceId,ar.timestamp from (
                select * from  attendancerecord as ar where ar.classId='${classId}'
            )as ar
            left join ${classId}_record as sr on sr.rid=ar.id
            right join (select * from student as stu 
            where stu.classId='${classId}') as stu on stu.id=sr.sid;
        `);
        const studentData = stur;
        let studentMatrix = students.map(s => new Array(attendanceRecords.length).fill(false));
        const attendanceIdArray = attendanceRecords.map(ar => ar.id);
        const studentIdArray = students.map(s => s.id);
        studentData.forEach((sd) => {
            const rid = attendanceIdArray.indexOf(sd.recordId);
            const sid = studentIdArray.indexOf(sd.studentId);
            studentMatrix[sid][rid] = true;
        });
        const studentDataResponse = students.map((s, i) => {
            return {
                id: s.id, classId: s.classId,
                name: s.name, roll: s.roll,
                attendance: studentMatrix[i]
            };
        });
        return res.status(200).json(Object.assign(Object.assign({}, classes[0]), { attendanceRecords, students: studentDataResponse }));
    }
    catch (error) {
        next(error);
    }
}));
router.delete('/', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No user found'));
        const id = req.body.id;
        if (!id)
            return next(new errorHandler_1.CustomError('no id found', 400));
        const database = yield config_1.default.build();
        const [row] = yield database.connection.query(`select * from class as c where c.id='${id}' and teacher='${req.user.id}';`);
        res.locals.classId = id;
        const classes = row;
        if (classes.length) {
            yield database.connection.query(`delete from class as c where c.id='${id}';`);
            yield database.connection.query(`drop table ${id}_record;`);
            return res.sendStatus(200);
        }
        return res.status(404).json('class not found');
    }
    catch (error) {
        next(error);
    }
}), classCreatingError_1.classCreatingError);
exports.default = router;
