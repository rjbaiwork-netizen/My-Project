import { prisma } from "./prisma.js";
import { generateAI, retrieveKnowledge, retrieveMemories, indexKnowledge, embedText } from "./ai.js";
import { getProviderEvents, getProviderRegistry } from "./providerRouter.js";
import { runAgent } from "./agentOrchestrator.js";
import { Prisma } from "../../generated/prisma/client.js";

export type ChatControlAction =
 | {type:"list-agents"} | {type:"run-agent";agentId:string;input:string}
 | {type:"list-knowledge"} | {type:"search-knowledge";query:string}
 | {type:"create-knowledge";title:string;content:string;source?:string}
 | {type:"update-knowledge";id:string;title?:string;content?:string} | {type:"delete-knowledge";id:string}
 | {type:"list-memories"} | {type:"search-memories";query:string}
 | {type:"create-memory";content:string;namespace?:string} | {type:"update-memory";id:string;content?:string;namespace?:string}
 | {type:"delete-memory";id:string} | {type:"list-automations"} | {type:"run-automation";id:string}
 | {type:"update-automation";id:string;status?:string;name?:string}
 | {type:"list-provider-status"} | {type:"list-provider-events"};

const readOnly=new Set(["list-agents","list-knowledge","search-knowledge","list-memories","search-memories","list-automations","list-provider-status","list-provider-events"]);
export const actionNeedsConfirmation=(a:ChatControlAction)=>!readOnly.has(a.type);

function parse(raw:string){return JSON.parse(raw.trim().replace(/^\`\`\`json\\s*/i,"").replace(/^\`\`\`\\s*/,"").replace(/\\s*\`\`\`$/,"").trim());}

export async function planChatControl(message:string){
 const prompt=`Return ONLY JSON for one My-Project control action, or {"action":null}. Never invent IDs. Supported:
list-agents; run-agent {agentId,input}; list-knowledge; search-knowledge {query}; create-knowledge {title,content,source?}; update-knowledge {id,title?,content?}; delete-knowledge {id}; list-memories; search-memories {query}; create-memory {content,namespace?}; update-memory {id,content?,namespace?}; delete-memory {id}; list-automations; run-automation {id}; update-automation {id,status?,name?}; list-provider-status; list-provider-events.
User: ${message}`;
 try{const raw=await generateAI([{role:"system",content:"Strict JSON intent classifier. No prose."},{role:"user",content:prompt}],"production");const a=parse(raw)?.action;return a&&typeof a.type==="string"?{action:a as ChatControlAction}:{action:null};}
 catch(e){console.warn("[AI_CHAT_CONTROL] planner unavailable",e instanceof Error?e.message:e);return {action:null};}
}

export async function executeChatControl(a:ChatControlAction):Promise<unknown>{
 switch(a.type){
 case "list-agents":return prisma.aIAgent.findMany({orderBy:{createdAt:"asc"},select:{id:true,key:true,name:true,description:true,status:true,createdAt:true,updatedAt:true}});
 case "run-agent":return runAgent(a.agentId,{source:"chat-control",message:a.input});
 case "list-knowledge":return prisma.aIKnowledgeDocument.findMany({orderBy:{updatedAt:"desc"},take:100,select:{id:true,title:true,source:true,updatedAt:true,embeddingProvider:true}});
 case "search-knowledge":return retrieveKnowledge(a.query,10);
 case "create-knowledge":{const d=await prisma.aIKnowledgeDocument.create({data:{title:a.title.trim(),content:a.content.trim(),source:a.source?.trim()||undefined}});await indexKnowledge(d.id);return prisma.aIKnowledgeDocument.findUnique({where:{id:d.id}});}
 case "update-knowledge":{const c=await prisma.aIKnowledgeDocument.findUnique({where:{id:a.id}});if(!c)throw Error("Knowledge document not found.");const changed=a.content!==undefined&&a.content.trim()!==c.content;const d=await prisma.aIKnowledgeDocument.update({where:{id:a.id},data:{...(a.title!==undefined?{title:a.title.trim()}:{}),...(a.content!==undefined?{content:a.content.trim()}:{}),...(changed?{embedding:Prisma.JsonNull,embeddingProvider:null}:{})}});if(changed)await indexKnowledge(d.id);return prisma.aIKnowledgeDocument.findUnique({where:{id:d.id}});}
 case "delete-knowledge":return prisma.aIKnowledgeDocument.delete({where:{id:a.id}});
 case "list-memories":return prisma.aIMemory.findMany({orderBy:{updatedAt:"desc"},take:200,select:{id:true,namespace:true,content:true,updatedAt:true,embeddingProvider:true}});
 case "search-memories":return retrieveMemories(a.query,10);
 case "create-memory":{let m=await prisma.aIMemory.create({data:{content:a.content.trim(),namespace:a.namespace?.trim()||"default",metadata:{type:"chat-control"}}});const e=await embedText(m.content,"knowledge");return prisma.aIMemory.update({where:{id:m.id},data:{embedding:e.vector,embeddingProvider:e.provider}});}
 case "update-memory":{const c=await prisma.aIMemory.findUnique({where:{id:a.id}});if(!c)throw Error("Memory not found.");const changed=a.content!==undefined&&a.content.trim()!==c.content;let m=await prisma.aIMemory.update({where:{id:a.id},data:{...(a.content!==undefined?{content:a.content.trim()}:{}),...(a.namespace!==undefined?{namespace:a.namespace.trim()||"default"}:{}),...(changed?{embedding:Prisma.JsonNull,embeddingProvider:null}:{})}});if(changed){const e=await embedText(m.content,"knowledge");m=await prisma.aIMemory.update({where:{id:m.id},data:{embedding:e.vector,embeddingProvider:e.provider}});}return m;}
 case "delete-memory":return prisma.aIMemory.delete({where:{id:a.id}});
 case "list-automations":return prisma.aIAutomation.findMany({orderBy:{updatedAt:"desc"},take:100,include:{agent:{select:{id:true,name:true}},_count:{select:{runs:true}}}});
 case "run-automation":{const x=await prisma.aIAutomation.findUnique({where:{id:a.id}});if(!x)throw Error("Automation not found.");if(x.status==="PAUSED")throw Error("Automation is paused.");return prisma.aIAutomationRun.create({data:{automationId:a.id,status:"QUEUED",input:{source:"chat-control"},maxAttempts:3}});}
 case "update-automation":{if(a.status!==undefined&&!["ACTIVE","PAUSED","DRAFT"].includes(a.status))throw Error("Invalid automation status.");return prisma.aIAutomation.update({where:{id:a.id},data:{...(a.status!==undefined?{status:a.status as any}:{}),...(a.name?.trim()?{name:a.name.trim()}: {})}});}
 case "list-provider-status":return {providers:getProviderRegistry()};
 case "list-provider-events":return getProviderEvents(50);
 }
}

export async function describeControlResult(a:ChatControlAction,r:unknown){
 try{return await generateAI([{role:"system",content:"Summarize this executed My-Project control action. Do not invent facts. Plain text."},{role:"user",content:JSON.stringify({action:a,result:r})}],"production");}
 catch{return `Action ${a.type} completed successfully.`;}
}