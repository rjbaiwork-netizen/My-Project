import type {Request,Response} from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { consumeConfirmation, type ConfirmationDelegate } from "../lib/confirmationStore.js";
import { actionNeedsConfirmation, describeControlResult, executeChatControl, planChatControl, type ChatControlAction } from "../lib/aiChatControl.js";

const fail=(res:Response,status:number,message:string)=>res.status(status).json({success:false,error:{message}});

export async function controlChat(req:Request,res:Response){
 try{
  if(req.body?.cancel===true){
   const confirmationId=typeof req.body?.confirmationId==="string"?req.body.confirmationId.trim():"";
   if(!confirmationId)return fail(res,400,"confirmationId is required.");
   const cancelled=await consumeConfirmation(prisma.aIControlConfirmation as unknown as ConfirmationDelegate,confirmationId);
   return cancelled.status==="consumed"?res.json({success:true,data:{mode:"cancelled"}}):fail(res,409,"Confirmation expired or already used.");
  }
  // Confirmation consumes the exact server-stored action; the natural-language prompt is never re-planned.
  if(req.body?.confirm===true){
   const confirmationId=typeof req.body?.confirmationId==="string"?req.body.confirmationId.trim():"";
   if(!confirmationId)return fail(res,400,"confirmationId is required.");
   const consumed=await consumeConfirmation(prisma.aIControlConfirmation as unknown as ConfirmationDelegate,confirmationId);
   if(consumed.status==="not-found")return fail(res,404,"Confirmation not found or already used.");
   if(consumed.status!=="consumed")return fail(res,409,"Confirmation expired or already used. Preview the action again.");
   const action=consumed.confirmation.action as unknown as ChatControlAction;
   if(!action||typeof action.type!=="string"||!actionNeedsConfirmation(action))return fail(res,400,"Stored confirmation action is invalid.");
   const result=await executeChatControl(action);
   const summary=await describeControlResult(action,result);
   return res.json({success:true,data:{mode:"executed",action,result,summary}});
  }

  const message=typeof req.body?.message==="string"?req.body.message.trim():"";
  if(!message)return fail(res,400,"message is required.");
  const planned=await planChatControl(message);
  if((planned as {plannerError?:boolean}).plannerError)return fail(res,503,"AI Control planner is unavailable. No control action was executed; please retry later.");
  if(!planned.action)return res.json({success:true,data:{mode:"conversation",action:null}});
  if(actionNeedsConfirmation(planned.action)){
   const confirmation=await prisma.aIControlConfirmation.create({
    data:{
     action:planned.action as unknown as Prisma.InputJsonValue,
     expiresAt:new Date(Date.now()+5*60*1000)
    }
   });
   return res.json({success:true,data:{mode:"action_preview",action:planned.action,confirmationId:confirmation.id,expiresAt:confirmation.expiresAt,requiresConfirmation:true}});
  }
  const result=await executeChatControl(planned.action);
  const summary=await describeControlResult(planned.action,result);
  return res.json({success:true,data:{mode:"executed",action:planned.action,result,summary}});
 }catch(error){
  console.error("[AI_CONTROL_CHAT]",error instanceof Error?error.message:"unknown error");
  return fail(res,500,"AI control action failed. No success was reported.");
 }
}
