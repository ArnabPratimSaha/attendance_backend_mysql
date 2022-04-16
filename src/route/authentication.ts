import express ,{NextFunction, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import bcrypt from 'bcrypt';
import { User, UserModel } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';


const router:Router=express.Router();
const saltRound:number=10;

router.post('/signup',async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const name: string|undefined=req.body.name;
        const email: string|undefined=req.body.email;
        const password:string|undefined=req.body.password;
        if (!process.env.SECRET)return next(new CustomError('server error',500));
        if( !name || !email || !password){
            return next( new CustomError( `Missing fields [name,email,password]`,400));
        }
        const preUser=await UserModel.findOne({email:email});
        if(preUser)return next(new CustomError(`User already exist`,400));
        const user=new UserModel({
            name,email
        })
        user.id=uuidv4();
        const salt=await bcrypt.genSalt(saltRound);
        const hash=await bcrypt.hash(password,salt);
        user.password=hash;
        const accesstoken = jwt.sign({ id: user.id }, process.env.SECRET,{ expiresIn:  60});//1 min 
        const refreshtoken=jwt.sign({ id: user.id }, process.env.SECRET,{expiresIn:'1y'});
        user.refreshtoken.push(refreshtoken);
        await user.save();
        return res.status(200).json({ accesstoken, refreshtoken, id: user.id,name,email });
    } catch (error) {
        return next(error);
    }
})

router.post('/login',async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const email: string|undefined=req.body.email;
        const password:string|undefined=req.body.password;
        if (!process.env.SECRET)return next(new CustomError('server error',500));
        if(!email || !password)return next(new CustomError('missing fields [email,password]',400));
        const user=await UserModel.findOne({email:email});
        if(!user)return next(new CustomError('user not found',404));
        const isSame:boolean=await bcrypt.compare(password,user.password);
        if(!isSame)return next(new CustomError('Credentials invalid',403));
        const accesstoken = jwt.sign({ id: user.id }, process.env.SECRET,{ expiresIn:  60});//1 min 
        const refreshtoken=jwt.sign({ id: user.id }, process.env.SECRET,{expiresIn:'1y'});
        user.refreshtoken.push(refreshtoken);
        await user.save();
        return res.status(200).json({ accesstoken, refreshtoken, id: user.id,name:user.name,email});
    } catch (error) {
        return next(error);
    }
});
router.delete('/logout',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User',404));
        const user=await UserModel.findOneAndUpdate({id:req.user.id},{$pull:{refreshtoken:req.refreshtoken}});
        if(!user)return next(new CustomError('No User',404));
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export default router;