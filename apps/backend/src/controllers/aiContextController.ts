import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

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