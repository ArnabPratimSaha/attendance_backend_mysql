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
const user_1 = require("../database/user");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
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
            const user = yield user_1.UserModel.findOne({ id: decoded.id });
            if (!user)
                return next(new errorHandler_1.CustomError('No user found', 404));
            req.accesstoken = accesstoken.toString();
            req.refreshtoken = req.headers.refreshtoken.toString();
            req.user = user;
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
                    const user = yield user_1.UserModel.findOne({ id: id });
                    if (!user)
                        return next(new errorHandler_1.CustomError('No user found', 404));
                    if (user.refreshtoken.includes(refreshtoken.toString())) {
                        req.accesstoken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.SECRET, { expiresIn: 60 }); //1 min
                        req.user = user;
                        req.refreshtoken = req.headers.refreshtoken.toString();
                        return next();
                    }
                    //user does not have refresh token or have a wrong refresh token
                    // user.refreshtoken = [];
                    // await user.save();
                    return next(new errorHandler_1.CustomError('Security breach', 401));
                }
                catch (e) {
                    console.log(e);
                    return next(new errorHandler_1.CustomError('unknow error', 500));
                }
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                //security breach(user used a malformed jwt)
                try {
                    if (!req.headers.id)
                        return next(new errorHandler_1.CustomError('Could not find id', 400));
                    const id = req.headers.id.toString();
                    const user = yield user_1.UserModel.findOne({ id: id });
                    if (!user)
                        return next(new errorHandler_1.CustomError('No user found', 404));
                    // user.refreshtoken = [];
                    // await user.save();
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
