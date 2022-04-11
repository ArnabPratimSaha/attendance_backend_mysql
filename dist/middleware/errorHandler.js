"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message = 'NO_MESSAGE', code = 500, isSendable = true) {
        super();
        this.message = message;
        this.code = code;
        this.isSendable = isSendable;
    }
}
exports.CustomError = CustomError;
const errorHandler = (err, req, res, next) => {
    if (res.headersSent)
        return next();
    console.log(err);
    if (err instanceof CustomError) {
        if (!err.isSendable)
            return res.sendStatus(err.code);
        return res.status(err.code).json(err.message);
    }
    return res.status(500).json('Unknown Error');
};
exports.errorHandler = errorHandler;
