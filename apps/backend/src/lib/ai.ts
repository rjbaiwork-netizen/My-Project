import { prisma } from "./prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
type ChatMessage={role:"system"|"user"|"assistant";content:string};
const provider=process.env.AI_PROVIDER??"openai";
const model=process.env.AI_MODEL??"gpt-6-luna";
const embeddingModel=process.env.AI_EMBEDDING_MODEL??"text-embedding-3-small";
function apiKey(){const key=process.env.OPENAI_API_KEY;if(!key)throw new Error("OPENAI_API_KEY is not configured.");return key;}
async function openAI(path:string,body:unknown){const response=await fetch(`https://api.openai.com/v1/${path}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey()}`},body:JSON.stringify(body)});if(!response.ok)throw new Error(`AI provider returned HTTP ${response.status}: ${await response.text()}`);return response.json() as Promise<Record<string,any>>;}
export async function generateAI(messages:ChatMessage[]){if(provider!=="openai")throw new Error(`Unsupported AI_PROVIDER: ${provider}`);const data=await openAI("responses",{model,input:messages.map(m=>({role:m.role,content:[{type:"input_text",text:m.content}]}))});return typeof data.output_text==="string"?data.output_text:"";}
export async function embedText(input:string){const data=await openAI("embeddings",{model:embeddingModel,input});const vector=data.data?.[0]?.embedding;if(!Array.isArray(vector))throw new Error("Embedding response did not contain a vector.");return vector as number[];}
function cosine(a:number[],b:number[]){let dot=0,aa=0,bb=0;const n=Math.min(a.length,b.length);for(let i=0;i<n;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return aa&&bb?dot/(Math.sqrt(aa)*Math.sqrt(bb)):0;}
export async function indexKnowledge(id:string){const doc=await prisma.aIKnowledgeDocument.findUnique({where:{id}});if(!doc)return;const embedding=await embedText(doc.content);await prisma.aIKnowledgeDocument.update({where:{id},data:{embedding}});}
export async function retrieveKnowledge(query:string,limit=5){const queryVector=await embedText(query);const docs=await prisma.aIKnowledgeDocument.findMany({where:{embedding:{not:Prisma.JsonNull}},take:500});return docs.map(d=>({d,score:cosine(queryVector,Array.isArray(d.embedding)?d.embedding as number[]:[])})).sort((a,b)=>b.score-a.score).slice(0,limit).filter(x=>x.score>0).map(x=>x.d);}
export async function retrieveMemories(query:string,limit=5){const queryVector=await embedText(query);const memories=await prisma.aIMemory.findMany({where:{embedding:{not:null}},take:500});return memories.map(m=>({m,score:cosine(queryVector,Array.isArray(m.embedding)?m.embedding as number[]:[])})).sort((a,b)=>b.score-a.score).slice(0,limit).filter(x=>x.score>0).map(x=>x.m);}
