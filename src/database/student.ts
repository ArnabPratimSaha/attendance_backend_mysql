import { Schema, model, connect } from 'mongoose';
interface Student {
    id:string;
    classId:string;
    name: string;
    attendenceArray:Array<boolean>;
    attendenceCount:number;
    roll:string
}

const schema = new Schema<Student>({
    id: { type: String, required: true, unique: true },
    classId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    attendenceArray:[{type:Boolean,required:true}],
    attendenceCount:{type:Number,required:true,default:0},
    roll:{type:String,required:true}
});
const StudentModel = model<Student>('Student', schema);

export {StudentModel,Student}