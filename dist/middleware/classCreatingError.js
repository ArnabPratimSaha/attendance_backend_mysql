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
exports.classCreatingError = void 0;
const config_1 = __importDefault(require("../database/config"));
const classCreatingError = (err, req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (res.headersSent)
            return next(err);
        const document = yield config_1.default.build();
        const [row] = yield document.connection.query(`delete from class as c where c.id='${res.locals.classId}';`);
        const classes = row;
        if (classes.length) {
            yield document.connection.query(`drop table ${res.locals.classId}_record;`);
        }
        return next(err);
    }
    catch (error) {
        return next(error);
    }
});
exports.classCreatingError = classCreatingError;
