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
exports.userHandler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const config_1 = __importDefault(require("../database/config"));
const userHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        try {
            if (!process.env.SECRET)
                return next(new errorHandler_1.CustomError('Could not find process.env.SECRET', 500, false));
            if (!req.headers.accesstoken)
                return next(new errorHandler_1.CustomError('Could not find accesstoken', 400));
            if (!req.headers.refreshtoken)
                return next(new errorHandler_1.CustomError('Could not find refreshtoken', 400));
            if (!req.headers.id)
                return next(new errorHandler_1.CustomError('Could not find id', 400));
            const accesstoken = req.headers.accesstoken.toString().trim();
            const decoded = jsonwebtoken_1.default.verify(accesstoken, process.env.SECRET);
            if (!decoded || decoded instanceof String)
                return next(new errorHandler_1.CustomError('empty accesstoken', 400));
            const database = yield config_1.default.build();
            const [rows] = yield database.connection.query(`select * from user where user.id='${decoded.id}';`);
            const users = rows;
            if (!users.length)
                return next(new errorHandler_1.CustomError('No user found', 404));
            req.accesstoken = accesstoken.toString();
            req.refreshtoken = req.headers.refreshtoken.toString();
            req.user = users[0];
            return next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                //refreshing the access token
                try {
                    if (!process.env.SECRET)
                        return next(new errorHandler_1.CustomError('Could not find process.env.SECRET', 500, false));
                    if (!req.headers.accesstoken)
                        return next(new errorHandler_1.CustomError('Could not find accesstoken', 400));
                    if (!req.headers.refreshtoken)
                        return next(new errorHandler_1.CustomError('Could not find refreshtoken', 400));
                    if (!req.headers.id)
                        return next(new errorHandler_1.CustomError('Could not find id', 400));
                    if (!process.env.SECRET)
                        return next(new errorHandler_1.CustomError('Could not find process.env.SECRET', 500, false));
                    const refreshtoken = req.headers.refreshtoken.toString().trim();
                    const id = req.headers.id.toString();
                    const database = yield config_1.default.build();
                    const [rows] = yield database.connection.query(`select * from user where user.id='${id}';`);
                    const users = rows;
                    if (!users.length)
                        return next(new errorHandler_1.CustomError('No user found', 404));
                    const [rt] = yield database.connection.query(`select * from refreshtoken as rt where rt.uid='${id}' and rt.token='${refreshtoken}' limit 1;`);
                    const token = rt;
                    if (!token.length)
                        return next(new errorHandler_1.CustomError('Security breach', 401));
                    req.accesstoken = jsonwebtoken_1.default.sign({ id: users[0].id }, process.env.SECRET, { expiresIn: 60 }); //1 min
                    req.user = users[0];
                    req.refreshtoken = req.headers.refreshtoken.toString();
                    return next();
                }
                catch (e) {
                    console.log(e);
                    return next(new errorHandler_1.CustomError('unknow error', 500));
                }
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                //security breach(user used a malformed jwt)
                try {
                    return next(new errorHandler_1.CustomError('Security breach', 401));
                }
                catch (e) {
                    console.log(e);
                    return next(new errorHandler_1.CustomError('unknow error', 500));
                }
            }
            console.log(error);
            return next(new errorHandler_1.CustomError('unknow error', 500));
        }
    }
    catch (error) {
        next(error);
    }
});
exports.userHandler = userHandler;
