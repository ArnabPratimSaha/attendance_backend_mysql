import { Schema, model, connect } from 'mongoose';
interface User {
    id:string;
    name: string;
    email: string;
    password:string;
}

export {User}