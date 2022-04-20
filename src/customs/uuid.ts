import {v4 as uuid} from 'uuid'
import { CustomError } from '../middleware/errorHandler';
export const getCustomid=():string=>{
    const id:string=uuid();
    let newId:string='';
    for(let i=0;i<id.length;i++){
        newId=newId.trim();
        if(id[i]=='-')newId+='_';
        else newId+=id[i];
    }
    if(newId)return newId.trim();
    throw new CustomError('uuid parsing failed',500,false);
}