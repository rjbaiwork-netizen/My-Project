import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { embedText, indexKnowledge, retrieveMemories } from "../lib/ai.js";

export async function listConversations(_req:Request,res:Response){
  try{
    const items=await prisma.aIConversation.findMany({
      orderBy:{updatedAt:"desc"},
      take:100,
      include:{_count:{select:{messages:true,memories:true}}}
    });
    res.json({success:true,data:items});
  }catch(error){
    res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load conversations."}});
  }
}

export async function getConversation(req:Request,res:Response){
  try{
    const item=await prisma.aIConversation.findUnique({
      where:{id:String(req.params.id)},
      include:{messages:{orderBy:{createdAt:"asc"}},memories:{orderBy:{createdAt:"desc"}}}
    });
    if(!item)return void res.status(404).json({success:false,error:{message:"Conversation not found."}});
    res.json({success:true,data:item});
  }catch(error){
    res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load conversation."}});
  }
}

export async function renameConversation(req:Request,res:Response){
  const title=typeof req.body?.title==="string"?req.body.title.trim():"";
  if(!title)return void res.status(400).json({success:false,error:{message:"title is required."}});
  try{
    const item=await prisma.aIConversation.update({where:{id:String(req.params.id)},data:{title:title.slice(0,120)}});
    res.json({success:true,data:item});
  }catch(error){
    res.status(404).json({success:false,error:{message:error instanceof Error?error.message:"Conversation not found."}});
  }
}

export async function deleteConversation(req:Request,res:Response){
  try{
    await prisma.aIConversation.delete({where:{id:String(req.params.id)}});
    res.json({success:true});
  }catch(error){
    res.status(404).json({success:false,error:{message:error instanceof Error?error.message:"Conversation not found."}});
  }
}

export async function updateKnowledge(req:Request,res:Response){
  const id=String(req.params.id);
  const {title,content,source,metadata}=req.body??{};
  if(title!==undefined&&(!("string"===typeof title)||!title.trim()))return void res.status(400).json({success:false,error:{message:"title must be a non-empty string."}});
  if(content!==undefined&&(!("string"===typeof content)||!content.trim()))return void res.status(400).json({success:false,error:{message:"content must be a non-empty string."}});
  try{
    const current=await prisma.aIKnowledgeDocument.findUnique({where:{id}});
    if(!current)return void res.status(404).json({success:false,error:{message:"Knowledge document not found."}});
    const changedContent=content!==undefined&&content.trim()!==current.content;
    const doc=await prisma.aIKnowledgeDocument.update({where:{id},data:{
      ...(title!==undefined?{title:title.trim()}:{}),
      ...(content!==undefined?{content:content.trim()}:{}),
      ...(source!==undefined?{source:typeof source==="string"&&source.trim()?source.trim():null}:{}),
      ...(metadata!==undefined?{metadata}:{}),
      ...(changedContent?{embedding:null}:{}),
    }});
    if(changedContent)void indexKnowledge(doc.id).catch(error=>console.error("Knowledge re-index failed",error));
    res.json({success:true,data:doc});
  }catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to update knowledge."}});}
}
export async function deleteKnowledge(req:Request,res:Response){
  try{await prisma.aIKnowledgeDocument.delete({where:{id:String(req.params.id)}});res.json({success:true});}
  catch(error){res.status(404).json({success:false,error:{message:error instanceof Error?error.message:"Knowledge document not found."}});}
}
export async function updateMemory(req:Request,res:Response){
  const id=String(req.params.id);
  const {content,namespace,metadata}=req.body??{};
  if(content!==undefined&&(!("string"===typeof content)||!content.trim()))return void res.status(400).json({success:false,error:{message:"content must be a non-empty string."}});
  try{
    const current=await prisma.aIMemory.findUnique({where:{id}});
    if(!current)return void res.status(404).json({success:false,error:{message:"Memory not found."}});
    const changedContent=content!==undefined&&content.trim()!==current.content;
    const memory=await prisma.aIMemory.update({where:{id},data:{
      ...(content!==undefined?{content:content.trim()}:{}),
      ...(namespace!==undefined?{namespace:typeof namespace==="string"&&namespace.trim()?namespace.trim():"default"}:{}),
      ...(metadata!==undefined?{metadata}:{}),
      ...(changedContent?{embedding:null}:{}),
    }});
    if(changedContent)void embedText(memory.content).then(embedding=>prisma.aIMemory.update({where:{id:memory.id},data:{embedding}})).catch(error=>console.error("Memory re-embedding failed",error));
    res.json({success:true,data:memory});
  }catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to update memory."}});}
}
export async function searchMemories(req:Request,res:Response){
  const q=typeof req.query.q==="string"?req.query.q.trim():"";
  if(!q)return void res.status(400).json({success:false,error:{message:"q is required."}});
  try{const items=await retrieveMemories(q,10);res.json({success:true,data:items});}
  catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to search memories."}});}
}

export async function listMemories(_req:Request,res:Response){
  try{
    const items=await prisma.aIMemory.findMany({orderBy:{updatedAt:"desc"},take:200});
    res.json({success:true,data:items});
  }catch(error){
    res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load memories."}});
  }
}

export async function createMemory(req:Request,res:Response){
  const content=typeof req.body?.content==="string"?req.body.content.trim():"";
  if(!content)return void res.status(400).json({success:false,error:{message:"content is required."}});
  try{
    const memory=await prisma.aIMemory.create({
      data:{
        content,
        namespace:typeof req.body?.namespace==="string"&&req.body.namespace.trim()?req.body.namespace.trim():"default",
        metadata:req.body?.metadata??{type:"manual"}
      }
    });
    void embedText(content).then(embedding=>prisma.aIMemory.update({where:{id:memory.id},data:{embedding}})).catch(error=>console.error("Memory embedding failed",error));
    res.status(201).json({success:true,data:memory});
  }catch(error){
    res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to create memory."}});
  }
}

export async function deleteMemory(req:Request,res:Response){
  try{
    await prisma.aIMemory.delete({where:{id:String(req.params.id)}});
    res.json({success:true});
  }catch(error){
    res.status(404).json({success:false,error:{message:error instanceof Error?error.message:"Memory not found."}});
  }
}