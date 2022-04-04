import { Schema, model, connect } from 'mongoose';
interface AClass {
    id:string;
    name: string;
    teachers:Array<string>;
    students:Array<string>;
    AttendenceArray:Array<Date>;
    AttendenceCount:Array<number>;
}

const schema = new Schema<AClass>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    teachers:[{type:String,required:true}],
    students:[{type:String,required:true}],
    AttendenceArray:[{type:Date,required:true}],
    AttendenceCount:[{type:Number,required:true}]
});
const ClassModel = model<AClass>('Class', schema);

export {ClassModel,AClass}