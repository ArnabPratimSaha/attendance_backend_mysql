import express,{Application} from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import  'dotenv/config';
import { errorHandler } from './middleware/errorHandler';

mongoose.connect(process.env.DATABASE||'').then(res=>{
    console.log(`Successfulluy connected to ${res.connection.db.databaseName} DATABASE`);
}).catch(err=>{
    console.log(`Could not connect to database`);
})

const app:Application=express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const PORT:string=process.env.PORT||'5000';
app.listen(PORT,()=>console.log(`Server started on port ${PORT}`));

import authentication  from './route/authentication';
import user from './route/user';
import classRoute from './route/class';
app.use('/auth',authentication);
app.use('/user',user);
app.use('/class',classRoute);

app.use(errorHandler);