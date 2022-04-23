import { NextFunction,Request,Response } from "express"
import { ClassInterface } from "../database/class";
import MySqlConnection from "../database/config";

export const classCreatingError = async (err: Error, req: Request, res: Response, next: NextFunction) => {
    try {
        if (res.headersSent) return next(err);
        const document = await MySqlConnection.build();
        const [row] = await document.connection.query(`delete from class as c where c.id='${res.locals.classId}';`);
        const classes: Array<ClassInterface> = row as Array<ClassInterface>;
        if (classes.length){
            await document.connection.query(`drop table ${res.locals.classId}_record;`);
        }
        return next(err);
    } catch (error) {
        return next(error);
    }
}    