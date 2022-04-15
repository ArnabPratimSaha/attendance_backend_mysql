import express,{Application, Request, Response} from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import  'dotenv/config';
import { errorHandler } from './middleware/errorHandler';
var whitelist = ['https://a10dence.vercel.app', 'http://localhost:3000']
var corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (origin && whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

mongoose.connect(process.env.DATABASE||'').then(res=>{
    console.log(`Successfulluy connected to ${res.connection.db.databaseName} DATABASE`);
}).catch(err=>{
    console.log(`Could not connect to database`);
})

const app:Application=express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.raw());

const PORT:string=process.env.PORT||'5000';
app.listen(PORT,()=>console.log(`Server started on port ${PORT}`));

import authentication  from './route/authentication';
import user from './route/user';
import classRoute from './route/class';
import studentRoute from './route/student';

app.get('/',(req:Request,res:Response)=>{
    res.status(200).json("server working");
})

app.use('/auth',authentication);
app.use('/user',user);
app.use('/class',classRoute);
app.use('/student',studentRoute);

app.use(errorHandler);