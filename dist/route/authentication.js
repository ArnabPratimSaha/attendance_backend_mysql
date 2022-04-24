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
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userHandler_1 = require("../middleware/userHandler");
const errorHandler_1 = require("../middleware/errorHandler");
const config_1 = __importDefault(require("../database/config"));
const router = express_1.default.Router();
const saltRound = 10;
router.post('/signup', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        if (!process.env.SECRET)
            return next(new errorHandler_1.CustomError('server error', 500));
        if (!name || !email || !password) {
            return next(new errorHandler_1.CustomError(`Missing fields [name,email,password]`, 400));
        }
        const database = yield config_1.default.build();
        const [rows] = yield database.connection.query(`select * from user where user.email='${email}';`);
        const users = rows;
        if (users.length)
            return next(new errorHandler_1.CustomError(`User already exist`, 400));
        const salt = yield bcrypt_1.default.genSalt(saltRound);
        const hash = yield bcrypt_1.default.hash(password, salt);
        const user = {
            id: (0, uuid_1.v4)(),
            password: hash,
            email, name
        };
        const accesstoken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.SECRET, { expiresIn: 60 }); //1 min 
        const refreshtoken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.SECRET, { expiresIn: '1y' });
        yield database.connection.query(`insert into user(id,name,email,password) values('${user.id}','${user.name}','${user.email}','${user.password}' );`);
        yield database.connection.query(`insert into refreshtoken(uid,token) values ('${user.id}','${refreshtoken}')`);
        return res.status(200).json({ accesstoken, refreshtoken, id: user.id, name: user.name, email: user.email });
    }
    catch (error) {
        return next(error);
    }
}));
router.post('/login', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        const password = req.body.password;
        if (!process.env.SECRET)
            return next(new errorHandler_1.CustomError('server error', 500));
        if (!email || !password)
            return next(new errorHandler_1.CustomError('missing fields [email,password]', 400));
        const database = yield config_1.default.build();
        const [rows] = yield database.connection.query(`select * from user where user.email='${email}';`);
        const users = rows;
        if (!users.length)
            return next(new errorHandler_1.CustomError('user not found', 404));
        const isSame = yield bcrypt_1.default.compare(password, users[0].password);
        if (!isSame)
            return next(new errorHandler_1.CustomError('Credentials invalid', 403));
        const accesstoken = jsonwebtoken_1.default.sign({ id: users[0].id }, process.env.SECRET, { expiresIn: 60 }); //1 min 
        const refreshtoken = jsonwebtoken_1.default.sign({ id: users[0].id }, process.env.SECRET, { expiresIn: '1y' });
        yield database.connection.query(`insert into refreshtoken(uid,token) values ('${users[0].id}','${refreshtoken}')`);
        return res.status(200).json({ accesstoken, refreshtoken, id: users[0].id, name: users[0].name, email });
    }
    catch (error) {
        return next(error);
    }
}));
router.delete('/logout', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User', 404));
        const database = yield config_1.default.build();
        const [rows] = yield database.connection.query(`delete from refreshtoken as rt where rt.token='${req.refreshtoken}';`);
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
