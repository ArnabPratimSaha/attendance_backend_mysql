import { Schema, model, connect } from 'mongoose';
interface User {
    id:string;
    name: string;
    email: string;
    password:string;
    refreshtoken:Array<String>;
}

const schema = new Schema<User>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password:{type:String,required:true},
    refreshtoken: [{type:String}],
});
const UserModel = model<User>('User', schema);

export {UserModel,User}