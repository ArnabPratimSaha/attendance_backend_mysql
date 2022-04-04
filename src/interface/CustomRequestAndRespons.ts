
import { Request, Response } from 'express';

interface CustomRequest extends Request {

}
interface CustomResponse extends Response {

}

export { CustomRequest, CustomResponse }