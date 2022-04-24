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
exports.teacherHandler = void 0;
const errorHandler_1 = require("./errorHandler");
const config_1 = __importDefault(require("../database/config"));
const teacherHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User'));
        const classId = (_a = req.headers.classid) === null || _a === void 0 ? void 0 : _a.toString().trim();
        if (!classId)
            return next(new errorHandler_1.CustomError('class id missing', 400));
        const database = yield config_1.default.build();
        const [row] = yield database.connection.query(`select * from class as c where c.id='${classId}';`);
        const classes = row;
        if (!classes.length)
            return next(new errorHandler_1.CustomError('class Not found', 404));
        if (classes[0].teacher !== req.user.id)
            return next(new errorHandler_1.CustomError('user does not have authorized to access the class', 403));
        req.classData = classes[0];
        return next();
    }
    catch (error) {
        next(error);
    }
});
exports.teacherHandler = teacherHandler;
