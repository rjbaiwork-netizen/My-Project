import type {Request,Response} from "express";
import { actionNeedsConfirmation, describeControlResult, executeChatControl, planChatControl } from "../lib/aiChatControl.js";

export async function controlChat(req:Request,res:Response){
 const message=typeof req.body?.message==="string"?req.body.message.trim():"";
 if(!message)return void res.status(400).json({success:false,error:{message:"message is required."}});
 try{
  const planned=await planChatControl(message);
  if(!planned.action)return res.json({success:true,data:{mode:"conversation",action:null}});
  if(actionNeedsConfirmation(planned.action)&&req.body?.confirm!==true)
   return res.json({success:true,data:{mode:"action_preview",action:planned.action,requiresConfirmation:true}});
  const result=await executeChatControl(planned.action);
  const summary=await describeControlResult(planned.action,result);
  res.json({success:true,data:{mode:"executed",action:planned.action,result,summary}});
 }catch(error){res.status(400).json({success:false,error:{message:error instanceof Error?error.message:"AI control action failed."}});}
}