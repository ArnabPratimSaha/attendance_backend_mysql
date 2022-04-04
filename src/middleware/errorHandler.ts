import { NextFunction } from "express";
import { CustomRequest, CustomResponse } from "../interface/CustomRequestAndRespons";

class CustomError extends Error{
    message: string;
    code:number;
    isSendable:boolean;
    constructor( message='NO_MESSAGE', code=500 ,isSendable=true ){
        super();
        this.message=message;
        this.code=code;
        this.isSendable=isSendable;
    }
}
const errorHandler = (err: any, req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    if (res.headersSent) return next();
    console.log(err);
    if (err instanceof CustomError) {
        if (!err.isSendable) return res.sendStatus(err.code);
        return res.status(err.code).json(err.message);
    }
    return res.status(500).json('Unknown Error');
}

export { CustomError, errorHandler }