import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { generateAI, retrieveKnowledge, retrieveMemories } from "../lib/ai.js";

export async function chat(req:Request,res:Response) {
  const message=typeof req.body?.message==="string"?req.body.message.trim():"";
  const conversationId=typeof req.body?.conversationId==="string"?req.body.conversationId:undefined;
  if(!message) return void res.status(400).json({success:false,error:{message:"message is required."}});
  try {
    const conversation=conversationId?await prisma.aIConversation.findUnique({where:{id:conversationId}}):await prisma.aIConversation.create({data:{title:message.slice(0,80)}});
    if(!conversation) return void res.status(404).json({success:false,error:{message:"Conversation not found."}});
    const [knowledge,memories]=await Promise.all([retrieveKnowledge(message),retrieveMemories(message)]);
    await prisma.aIMessage.create({data:{conversationId:conversation.id,role:"user",content:message}});
    const context=[...knowledge.map(k=>`Knowledge: ${k.title}\n${k.content}`),...memories.map(m=>`Memory: ${m.content}`)].join("\n\n");
    let answer:string;
    try { answer=await generateAI([{role:"system",content:"You are the My-Project AI Assistant. Use the supplied project context when relevant. Do not claim to have executed actions unless a verified tool result is provided."},{role:"user",content:context?`Project context:\n${context}\n\nUser request:\n${message}`:message}]); }
    catch(error) { return void res.status(503).json({success:false,error:{message:error instanceof Error?error.message:"AI provider unavailable."},data:{conversationId:conversation.id,knowledgeCount:knowledge.length,memoryCount:memories.length}}); }
    await prisma.aIMessage.create({data:{conversationId:conversation.id,role:"assistant",content:answer}});
    await prisma.aIMemory.create({data:{conversationId:conversation.id,namespace:"conversation",content:message,metadata:{type:"user_message"}}});
    res.json({success:true,data:{conversationId:conversation.id,answer,knowledge,memories}});
  } catch(error) { console.error(error); res.status(500).json({success:false,error:{message:"AI chat failed."}}); }
}

export async function listAgents(_req:Request,res:Response) {
  try { res.json({success:true,data:await prisma.aIAgent.findMany({orderBy:{createdAt:"asc"}})}); }
  catch { res.status(500).json({success:false,error:{message:"Unable to load AI agents."}}); }
}

export async function createJob(req:Request,res:Response) {
  const {type,payload,agentId,scheduledAt}=req.body??{};
  if(typeof type!=="string"||!type.trim()) return void res.status(400).json({success:false,error:{message:"type is required."}});
  const job=await prisma.aIJob.create({data:{type:type.trim(),payload:payload??{},agentId:typeof agentId==="string"?agentId:undefined,scheduledAt:scheduledAt?new Date(scheduledAt):undefined}});
  res.status(202).json({success:true,data:job});
}

export async function listJobs(_req:Request,res:Response) {
  try { res.json({success:true,data:await prisma.aIJob.findMany({orderBy:{createdAt:"desc"},take:100})}); }
  catch { res.status(500).json({success:false,error:{message:"Unable to load AI jobs."}}); }
}

export async function addKnowledge(req:Request,res:Response) {
  const {title,content,source,metadata}=req.body??{};
  if(typeof title!=="string"||!title.trim()||typeof content!=="string"||!content.trim()) return void res.status(400).json({success:false,error:{message:"title and content are required."}});
  const doc=await prisma.aIKnowledgeDocument.create({data:{title:title.trim(),content:content.trim(),source:typeof source==="string"?source:undefined,metadata:metadata??undefined}});
  res.status(201).json({success:true,data:doc});
}

export async function listKnowledge(_req:Request,res:Response) {
  try { res.json({success:true,data:await prisma.aIKnowledgeDocument.findMany({orderBy:{updatedAt:"desc"}})}); }
  catch { res.status(500).json({success:false,error:{message:"Unable to load knowledge base."}}); }
}
