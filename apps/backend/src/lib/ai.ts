import { prisma } from "./prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { generateAI as routeGenerateAI, embedText as routeEmbedText } from "./providerRouter.js";
export type AIPurpose="knowledge"|"agent"|"production";
type ChatMessage={role:"system"|"user"|"assistant";content:string};

export async function generateAI(messages:ChatMessage[],purpose:AIPurpose="production"){
  return routeGenerateAI(messages,purpose);
}
export async function embedText(input:string,purpose:AIPurpose="knowledge"){
  return routeEmbedText(input,purpose);
}
function cosine(a:number[],b:number[]){
  if(a.length!==b.length)return 0;
  let dot=0,aa=0,bb=0;
  for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
  return aa&&bb?dot/(Math.sqrt(aa)*Math.sqrt(bb)):0;
}
export async function indexKnowledge(id:string){
  const doc=await prisma.aIKnowledgeDocument.findUnique({where:{id}});
  if(!doc)return;
  const result=await embedText(doc.content,"knowledge");
  await prisma.aIKnowledgeDocument.update({where:{id},data:{embedding:result.vector,embeddingProvider:result.provider}});
}
export async function reindexKnowledge(){
  const docs=await prisma.aIKnowledgeDocument.findMany({select:{id:true}});
  let indexed=0;
  for(const doc of docs){await indexKnowledge(doc.id);indexed++;}
  return {indexed};
}
export async function retrieveKnowledge(query:string,limit=5,purpose:AIPurpose="knowledge"){
  const result=await embedText(query,purpose);
  const docs=await prisma.aIKnowledgeDocument.findMany({where:{embedding:{not:Prisma.JsonNull},embeddingProvider:result.provider},take:500});
  return docs.map(d=>({d,score:cosine(result.vector,Array.isArray(d.embedding)?d.embedding as number[]:[])}))
    .sort((a,b)=>b.score-a.score).slice(0,limit).filter(x=>x.score>0).map(x=>x.d);
}
export async function retrieveMemories(query:string,limit=5,purpose:AIPurpose="knowledge"){
  const result=await embedText(query,purpose);
  const memories=await prisma.aIMemory.findMany({where:{embedding:{not:Prisma.JsonNull},embeddingProvider:result.provider},take:500});
  return memories.map(m=>({m,score:cosine(result.vector,Array.isArray(m.embedding)?m.embedding as number[]:[])}))
    .sort((a,b)=>b.score-a.score).slice(0,limit).filter(x=>x.score>0).map(x=>x.m);
}
