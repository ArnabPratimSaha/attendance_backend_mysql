import express,{Application, Request, Response} from 'express';
import cors from 'cors';
import  'dotenv/config';
import { errorHandler } from './middleware/errorHandler';
import MySqlConnection from './database/config';
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
const runBaseQueries=async()=>{
    try {
        const db=await MySqlConnection.build();
        await db.connection.query(`create table if not exists class( id varchar(255) primary key,name varchar(255) not null,createdAt datetime not null,teacher varchar(255),foreign key (teacher) references user(id)  );`)
        await db.connection.query(`create table if not exists user(id varchar(255) unique not null,name varchar(255) not null,email varchar(255) primary key not null,password varchar(255) not null); `)
        await db.connection.query(`create table if not exists attendancerecord(id varchar(255) primary key,classId varchar(255) not null,timestamp datetime not null, foreign key (classId) references class(id) on delete cascade );`)
        await db.connection.query(`create table if not exists student (id varchar(255) primary key,classId varchar(255) not null,foreign key (classId) references class(id),roll varchar(255) not null, name varchar(255) not null )`)
    } catch (error) {
        throw error;
    }
}
console.log('RUNNING BASE QUERIES...');
runBaseQueries().then(() => {
    console.log('SUCCESSFULLY RUN THE QUERIES.');
}).catch(err => {
    console.log('COULD NOT RUN THE QUERIES.');

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