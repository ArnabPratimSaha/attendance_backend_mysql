"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const errorHandler_1 = require("./middleware/errorHandler");
const config_1 = __importDefault(require("./database/config"));
var whitelist = ['https://a10dence.vercel.app', 'http://localhost:3000'];
var corsOptions = {
    origin: (origin, callback) => {
        if (origin && whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
const runBaseQueries = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield config_1.default.build();
        yield db.connection.query(`create table if not exists user(id varchar(255) unique not null,name varchar(255) not null,email varchar(255) primary key not null,password varchar(255) not null); `);
        yield db.connection.query(`create table if not exists refreshtoken(uid varchar(255) not null,foreign key (uid) references user(id) on delete cascade,token varchar(255) not null)`);
        yield db.connection.query(`create table if not exists class( id varchar(255) primary key,name varchar(255) not null,createdAt datetime not null,teacher varchar(255),foreign key (teacher) references user(id) on delete cascade );`);
        yield db.connection.query(`create table if not exists student (id varchar(255) primary key,classId varchar(255) not null,foreign key (classId) references class(id) on delete cascade,roll varchar(255) not null, name varchar(255) not null )`);
        yield db.connection.query(`create table if not exists attendancerecord(id varchar(255) primary key,classId varchar(255) not null,timestamp datetime not null, foreign key (classId) references class(id) on delete cascade );`);
    }
    catch (error) {
        throw error;
    }
});
console.log('RUNNING BASE QUERIES...');
runBaseQueries().then(() => {
    console.log('SUCCESSFULLY RUN THE QUERIES.');
}).catch(err => {
    console.log(err);
    console.log('COULD NOT RUN THE QUERIES.');
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.raw());
const PORT = process.env.PORT || '5000';
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
const authentication_1 = __importDefault(require("./route/authentication"));
const user_1 = __importDefault(require("./route/user"));
const class_1 = __importDefault(require("./route/class"));
const student_1 = __importDefault(require("./route/student"));
app.get('/', (req, res) => {
    res.status(200).json("server working");
});
app.use('/auth', authentication_1.default);
app.use('/user', user_1.default);
app.use('/class', class_1.default);
app.use('/student', student_1.default);
app.use(errorHandler_1.errorHandler);
