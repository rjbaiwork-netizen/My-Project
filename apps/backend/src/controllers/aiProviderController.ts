import type {Request,Response} from "express";
import {getProviderEvents,getProviderRegistry} from "../lib/providerRouter.js";
export async function listAIProviders(_req:Request,res:Response){
  res.json({success:true,data:{providers:getProviderRegistry(),order:(process.env.AI_PROVIDER_ORDER??"openai,gemini,groq,mistral,openrouter").split(",").map(x=>x.trim()).filter(Boolean)}});
}
export async function listAIProviderEvents(req:Request,res:Response){
  const limit=Number(req.query.limit??100);
  try{res.json({success:true,data:await getProviderEvents(Number.isFinite(limit)?limit:100)});}
  catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load provider logs."}});}
}
