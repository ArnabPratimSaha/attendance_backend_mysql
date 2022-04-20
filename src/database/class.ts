import { Schema, model, connect } from 'mongoose';
interface ClassInterface {
    id:string;
    name: string;
    teacher:string;
    createdAt:Date;
}
export {ClassInterface}