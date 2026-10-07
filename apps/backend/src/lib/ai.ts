import { prisma } from "./prisma.js";

type ChatMessage={role:"system"|"user"|"assistant";content:string};

const provider=process.env.AI_PROVIDER??"openai";
const model=process.env.AI_MODEL??"gpt-5-mini";

export async function generateAI(messages:ChatMessage[]) {
  if(provider!=="openai") throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  const key=process.env.OPENAI_API_KEY;
  if(!key) throw new Error("OPENAI_API_KEY is not configured.");
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({model,input:messages.map(m=>({role:m.role,content:[{type:"input_text",text:m.content}]}))})});
  if(!response.ok) throw new Error(`AI provider returned HTTP ${response.status}: ${await response.text()}`);
  const data=await response.json() as {output_text?:string};
  return data.output_text??"";
}

export async function retrieveKnowledge(query:string,limit=5) {
  const terms=query.toLowerCase().split(/\\W+/).filter(Boolean).slice(0,12);
  const docs=await prisma.aIKnowledgeDocument.findMany({orderBy:{updatedAt:"desc"},take:100});
  return docs.map(d=>({d,score:terms.reduce((n,t)=>n+(d.title.toLowerCase().includes(t)?3:0)+(d.content.toLowerCase().includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.d);
}

export async function retrieveMemories(query:string,limit=5) {
  const terms=query.toLowerCase().split(/\\W+/).filter(Boolean).slice(0,12);
  const memories=await prisma.aIMemory.findMany({orderBy:{updatedAt:"desc"},take:100});
  return memories.map(m=>({m,score:terms.reduce((n,t)=>n+(m.content.toLowerCase().includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.m);
}
