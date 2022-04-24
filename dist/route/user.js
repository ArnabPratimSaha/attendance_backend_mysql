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
const userHandler_1 = require("../middleware/userHandler");
const errorHandler_1 = require("../middleware/errorHandler");
const config_1 = __importDefault(require("../database/config"));
const router = express_1.default.Router();
router.get('/', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User', 404));
        return res.status(200).json({ name: req.user.name, email: req.user.email, id: req.user.id, accesstoken: req.accesstoken });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/class', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User', 404));
        const database = yield config_1.default.build();
        const [row] = yield database.connection.query(`
        select * from (select rec.id,c.name,c.createdAt,c.teacher,rec.studentCount,rec.recordCount from (select srec.id,srec.studentCount,rrec.recordCount from (select ifnull(srec.studentCount,0) as studentCount,srec.id from  (select * from class as c left join (select count(*) as studentCount,classId from student as s group by s.classId) as ns on c.id=ns.classId) as srec)
            as srec 
        inner join
        (select ifnull(rrec.recordCount,0) as recordCount,rrec.id from (select * from  class as c left join (select count(*) as recordCount,classId from  attendancerecord as ar group by ar.classId) as nr on c.id=nr.classId) as rrec) as rrec
        on srec.id=rrec.id) as rec
        inner join class as c where c.id=rec.id) as classinfo where classinfo.teacher='${req.user.id}';
        `);
        let classes = row;
        return res.status(200).json({ classes, accesstoken: req.accesstoken });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
