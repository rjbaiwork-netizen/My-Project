import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { generateAI, retrieveKnowledge, retrieveMemories, embedText, indexKnowledge, reindexKnowledge } from "../lib/ai.js";
import { runAgent, runOrchestrator } from "../lib/agentOrchestrator.js";

export async function chat(req:Request,res:Response){
  const message=typeof req.body?.message==="string"?req.body.message.trim():"";
  const conversationId=typeof req.body?.conversationId==="string"?req.body.conversationId:undefined;
  if(!message)return void res.status(400).json({success:false,error:{message:"message is required."}});
  try{
    const conversation=conversationId?await prisma.aIConversation.findUnique({where:{id:conversationId}}):await prisma.aIConversation.create({data:{title:message.slice(0,80)}});
    if(!conversation)return void res.status(404).json({success:false,error:{message:"Conversation not found."}});
    await prisma.aIMessage.create({data:{conversationId:conversation.id,role:"user",content:message}});
    await prisma.aIConversation.update({where:{id:conversation.id},data:{updatedAt:new Date()}});
    const history=await prisma.aIMessage.findMany({where:{conversationId:conversation.id},orderBy:{createdAt:"asc"},take:30});

    // Embeddings/RAG always use the knowledge provider pool. Generation can use
    // the production provider pool independently, so provider switching cannot
    // silently make stored vectors incompatible with the query vector.
    const [knowledge,memories]=await Promise.all([
      retrieveKnowledge(message,5,"knowledge").catch(()=>[]),
      retrieveMemories(message,5,"knowledge").catch(()=>[])
    ]);
    const context=[...knowledge.map(k=>`Knowledge: ${k.title}\n${k.content}`),...memories.map(m=>`Memory: ${m.content}`)].join("\n\n");
    const answer=await generateAI([
      {role:"system",content:"You are the My-Project AI Assistant. Use verified project context. Never claim an external action was executed without a tool result."},
      ...history.filter(m=>m.role==="user"||m.role==="assistant").map(m=>({role:m.role as "user"|"assistant",content:m.content})),
      {role:"user",content:context?`Relevant project context:\n${context}\n\nCurrent request:\n${message}`:message}
    ],"production");

    const requestedAgentId=typeof req.body?.agentId==="string"?req.body.agentId:undefined;
    const agentRun=requestedAgentId?await runAgent(requestedAgentId,{source:"chat",message,conversationId:conversation.id,context:{knowledgeCount:knowledge.length,memoryCount:memories.length}}):null;
    await prisma.aIMessage.create({data:{conversationId:conversation.id,role:"assistant",content:answer}});

    const memory=await prisma.aIMemory.create({data:{conversationId:conversation.id,namespace:"conversation",content:message,metadata:{type:"user_message"}}});
    const embedding=await embedText(message,"knowledge");
    await prisma.aIMemory.update({where:{id:memory.id},data:{embedding:embedding.vector,embeddingProvider:embedding.provider}});
    await prisma.aIConversation.update({where:{id:conversation.id},data:{updatedAt:new Date()}});

    res.json({success:true,data:{conversationId:conversation.id,answer,knowledge,memories,agentRun}});
  }catch(error){console.error(error);res.status(503).json({success:false,error:{message:error instanceof Error?error.message:"AI chat failed."}});}
}

export async function listAgents(_req:Request,res:Response){try{res.json({success:true,data:await prisma.aIAgent.findMany({orderBy:{createdAt:"asc"}})});}catch{res.status(500).json({success:false,error:{message:"Unable to load AI agents."}});}}
export async function runAgentRoute(req:Request,res:Response){try{const result=await runAgent(String(req.params.id),req.body?.input??{});res.status(202).json({success:true,data:result});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Agent execution failed."}});}}
export async function orchestrate(req:Request,res:Response){try{const result=await runOrchestrator(req.body?.input??{});res.status(202).json({success:true,data:result});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Orchestration failed."}});}}
export async function createJob(req:Request,res:Response){const {type,payload,agentId,scheduledAt}=req.body??{};if(typeof type!=="string"||!type.trim())return void res.status(400).json({success:false,error:{message:"type is required."}});const job=await prisma.aIJob.create({data:{type:type.trim(),payload:payload??{},agentId:typeof agentId==="string"?agentId:undefined,scheduledAt:scheduledAt?new Date(scheduledAt):new Date()}});res.status(202).json({success:true,data:job});}
export async function listJobs(_req:Request,res:Response){try{res.json({success:true,data:await prisma.aIJob.findMany({orderBy:{createdAt:"desc"},take:100})});}catch{res.status(500).json({success:false,error:{message:"Unable to load AI jobs."}});}}
export async function addKnowledge(req:Request,res:Response){
  const {title,content,source,metadata}=req.body??{};
  if(typeof title!=="string"||!title.trim()||typeof content!=="string"||!content.trim())return void res.status(400).json({success:false,error:{message:"title and content are required."}});
  try{
    const doc=await prisma.aIKnowledgeDocument.create({data:{title:title.trim(),content:content.trim(),source:typeof source==="string"?source:undefined,metadata:metadata??undefined}});
    await indexKnowledge(doc.id);
    const refreshed=await prisma.aIKnowledgeDocument.findUnique({where:{id:doc.id}});
    res.status(201).json({success:true,data:refreshed??doc});
  }catch(error){res.status(503).json({success:false,error:{message:error instanceof Error?error.message:"Unable to index knowledge."}});}
}
export async function listKnowledge(_req:Request,res:Response){try{res.json({success:true,data:await prisma.aIKnowledgeDocument.findMany({orderBy:{updatedAt:"desc"}})});}catch{res.status(500).json({success:false,error:{message:"Unable to load knowledge base."}});}}
