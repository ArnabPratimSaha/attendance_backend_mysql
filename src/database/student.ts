import { Schema, model, connect } from 'mongoose';
interface Student {
    id:string;
    classId:string;
    name: string;
    attendanceArray:Array<boolean>;
    roll:string
}

const schema = new Schema<Student>({
    id: { type: String, required: true, unique: true },
    classId: { type: String, required: true },
    name: { type: String, required: true },
    attendanceArray:[{type:Boolean,required:true}],
    roll:{type:String,required:true}
});
const StudentModel = model<Student>('Student', schema);

export {StudentModel,Student}