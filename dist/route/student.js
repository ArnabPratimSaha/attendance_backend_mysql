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
const router = express_1.default.Router();
router.post('/', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const name = req.body.name;
        const roll = req.body.roll;
        if (!name || !roll)
            return next(new errorHandler_1.CustomError('missing field name or roll', 400));
        if (!req.classData)
            return next(new errorHandler_1.CustomError('Class not found', 404));
        const database = yield config_1.default.build();
        const student = {
            id: (0, uuid_1.v4)(),
            name: name,
            roll: roll,
            classId: req.classData.id,
        };
        yield database.connection.query(`insert into student(id,name,roll,classId) values('${student.id}','${student.name}','${student.roll}','${student.classId}');`);
        return res.status(200).json(Object.assign(Object.assign({}, student), { accesstoken: req.accesstoken }));
    }
    catch (error) {
        next(error);
    }
}));
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = (_a = req.query.id) === null || _a === void 0 ? void 0 : _a.toString().trim();
        const cid = (_b = req.query.cid) === null || _b === void 0 ? void 0 : _b.toString().trim();
        if (!id || !cid)
            return next(new errorHandler_1.CustomError('cid or id missing', 400));
        const database = yield config_1.default.build();
        const [c] = yield database.connection.query(`select * from class as c where c.id='${cid}';`);
        const classes = c;
        if (!classes.length)
            return next(new errorHandler_1.CustomError(`class not found`, 404));
        const [s] = yield database.connection.query(`select * from student as s where s.id='${id}';`);
        const students = s;
        if (!students.length)
            return next(new errorHandler_1.CustomError('student not found', 404));
        const [row] = yield database.connection.query(`
        select * from  (select ar.id,ar.timestamp,case ifnull(res.id,'0') when '0' then false else true end as remark from  attendancerecord as ar 
            left join
        (select sr.id,sr.rid,sr.cid from  ${cid}_record as sr where sr.sid='${id}')as res 
            on res.rid=ar.id) as rec order by rec.timestamp desc
        ;`);
        const studentInfo = row;
        res.status(200).json(Object.assign(Object.assign({ teacher: classes[0].teacher }, students[0]), { attendance: studentInfo }));
    }
    catch (error) {
        next(error);
    }
}));
router.patch('/', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    try {
        const id = (_c = req.body.id) === null || _c === void 0 ? void 0 : _c.trim();
        const name = (_d = req.body.name) === null || _d === void 0 ? void 0 : _d.toString().trim();
        const roll = (_e = req.body.roll) === null || _e === void 0 ? void 0 : _e.toString().trim();
        const database = yield config_1.default.build();
        yield database.connection.query(`update student as s set s.name='${name}',s.roll='${roll}' where s.id='${id}';`);
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
router.delete('/', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const id = (_f = req.body.id) === null || _f === void 0 ? void 0 : _f.trim();
        if (!id)
            return next(new errorHandler_1.CustomError('id missing', 400));
        const database = yield config_1.default.build();
        yield database.connection.query(`delete from student as s where s.id='${id}';`);
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
