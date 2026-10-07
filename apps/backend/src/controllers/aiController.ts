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
    const [knowledge,memories]=await Promise.all([retrieveKnowledge(message,5,"knowledge").catch(()=>[]),retrieveMemories(message,5,"knowledge").catch(()=>[])]);
    const context=[...knowledge.map(k=>`Knowledge: ${k.title}\n${k.content}`),...memories.map(m=>`Memory: ${m.content}`)].join("\n\n");
    const answer=await generateAI([{role:"system",content:"You are the My-Project AI Assistant. Use verified project context. Never claim an external action was executed without a tool result."},...history.filter(m=>m.role==="user"||m.role==="assistant").map(m=>({role:m.role as "user"|"assistant",content:m.content})),{role:"user",content:context?`Relevant project context:\n${context}\n\nCurrent request:\n${message}`:message}],"production");
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
export async function agentAutomationOverview(_req:Request,res:Response){try{const agents=await prisma.aIAgent.findMany({include:{brainCategories:{orderBy:{updatedAt:"desc"}},_count:{select:{runs:true,jobs:true,automations:true}}},orderBy:{createdAt:"asc"}});const automations=await prisma.aIAutomation.findMany({include:{agent:true,runs:{orderBy:{createdAt:"desc"},take:5}},orderBy:{updatedAt:"desc"},take:50});res.json({success:true,data:{agents,automations}});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load agent automation workspace."}});}}
export async function diagnoseAutomation(req:Request,res:Response){
  const input=req.body??{};
  const issues:string[]=[];
  const fixes:string[]=[];
  const trigger=input.trigger;
  const actions=Array.isArray(input.actions)?input.actions:[];
  const conditions=Array.isArray(input.conditions)?input.conditions:[];
  if(!input.name||typeof input.name!=="string"||!input.name.trim())issues.push("Automation name is missing.");
  if(!trigger||typeof trigger.type!=="string")issues.push("Trigger type is missing.");
  else if(!["manual","schedule","new-content","content-updated","new-task","agent-completed","knowledge-updated","approval-completed","webhook","system-event"].includes(String(trigger.type)))issues.push("Trigger type is unsupported.");
  if(!actions.length)issues.push("At least one action is required.");
  actions.forEach((a:any,i:number)=>{
    if(!a||typeof a.type!=="string")issues.push(`Action ${i+1} is missing its type.`);
    else if(!["run-agent","create-task","generate-content","update-content","search-knowledge","store-memory","request-approval","send-notification","run-agent-chain","start-automation","stop-automation"].includes(a.type))issues.push(`Action ${i+1} has an unsupported type.`);
    if(a?.type==="run-agent"&&!a.agentId&&typeof input.agentId==="string"&&input.agentId){fixes.push(`Action ${i+1}: inherited the selected agent.`);}
  });
  conditions.forEach((c:any,i:number)=>{
    if(!c?.field||typeof c.field!=="string")issues.push(`Condition ${i+1} is missing a field.`);
    if(!c?.operator||typeof c.operator!=="string")issues.push(`Condition ${i+1} is missing an operator.`);
    if(c?.value===undefined||c?.value===null)issues.push(`Condition ${i+1} is missing a value.`);
  });
  res.json({success:true,data:{valid:issues.length===0,issues,fixes,diagnosis:issues.length?"Automatic safe fixes were checked; unresolved items require user attention.":"Configuration passed the diagnostic checks."}});
}
export async function createAutomation(req:Request,res:Response){const {name,description,trigger,conditions,actions,agentId,approval}=req.body??{};if(typeof name!=="string"||!name.trim()||!trigger||!actions)return void res.status(400).json({success:false,error:{message:"name, trigger and actions are required."}});if(typeof trigger.type!=="string")return void res.status(400).json({success:false,error:{message:"trigger.type is required."}});if(!Array.isArray(actions))return void res.status(400).json({success:false,error:{message:"actions must be an array."}});const allowedTriggers=["manual","schedule","new-content","content-updated","new-task","agent-completed","knowledge-updated","approval-completed","webhook","system-event"];const allowedActions=["run-agent","create-task","generate-content","update-content","search-knowledge","store-memory","request-approval","send-notification","run-agent-chain","start-automation","stop-automation"];if(!allowedTriggers.includes(String(trigger.type)))return void res.status(400).json({success:false,error:{message:"Unsupported trigger type."}});if(actions.some((a:any)=>!a||typeof a.type!=="string"||!allowedActions.includes(a.type)))return void res.status(400).json({success:false,error:{message:"Unsupported automation action."}});try{const automation=await prisma.aIAutomation.create({data:{name:name.trim(),description:typeof description==="string"?description:undefined,trigger,conditions:conditions??undefined,actions,agentId:typeof agentId==="string"?agentId:undefined,approval:approval??undefined}});res.status(201).json({success:true,data:automation});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to create automation."}});}}
export async function updateAutomation(req:Request,res:Response){const id=String(req.params.id);const {name,description,trigger,conditions,actions,agentId,status,approval}=req.body??{};try{const current=await prisma.aIAutomation.findUnique({where:{id}});if(!current)return void res.status(404).json({success:false,error:{message:"Automation not found."}});if(status!==undefined&&!["ACTIVE","PAUSED","DRAFT"].includes(String(status)))return void res.status(400).json({success:false,error:{message:"Invalid automation status."}});const data:any={};if(typeof name==="string"&&name.trim())data.name=name.trim();if(description!==undefined)data.description=typeof description==="string"?description:undefined;if(trigger!==undefined)data.trigger=trigger;if(conditions!==undefined)data.conditions=conditions;if(actions!==undefined)data.actions=actions;if(agentId!==undefined)data.agentId=typeof agentId==="string"&&agentId?agentId:null;if(status!==undefined)data.status=status;if(approval!==undefined)data.approval=approval;const automation=await prisma.aIAutomation.update({where:{id},data});res.json({success:true,data:automation});}catch(error){res.status(400).json({success:false,error:{message:error instanceof Error?error.message:"Unable to update automation."}});}}
export async function runAutomation(req:Request,res:Response){const automationId=String(req.params.id);try{const automation=await prisma.aIAutomation.findUnique({where:{id:automationId}});if(!automation)return void res.status(404).json({success:false,error:{message:"Automation not found."}});if(automation.status==="PAUSED")return void res.status(409).json({success:false,error:{message:"Automation is paused."}});const maxAttempts=Math.min(10,Math.max(1,Number(req.body?.maxAttempts??3)));const run=await prisma.aIAutomationRun.create({data:{automationId,input:req.body?.input??{},status:"QUEUED",maxAttempts}});res.status(202).json({success:true,data:run});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to queue automation."}});}}
export async function approveAutomationRun(req:Request,res:Response){try{const run=await prisma.aIAutomationRun.findUnique({where:{id:String(req.params.runId)}});if(!run)return void res.status(404).json({success:false,error:{message:"Automation run not found."}});if(run.status!=="APPROVAL_REQUIRED")return void res.status(409).json({success:false,error:{message:"Run is not waiting for approval."}});const input={...((run.input??{}) as Record<string,unknown>),approvalApproved:true,approvedBy:req.body?.approver??"manual"};const updated=await prisma.aIAutomationRun.update({where:{id:run.id},data:{input,status:"QUEUED",error:null,finishedAt:null}});res.status(202).json({success:true,data:updated});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to approve automation run."}});}}
export async function retryAutomationRun(req:Request,res:Response){try{const run=await prisma.aIAutomationRun.findUnique({where:{id:String(req.params.runId)}});if(!run)return void res.status(404).json({success:false,error:{message:"Automation run not found."}});if(!["FAILED","APPROVAL_REQUIRED"].includes(run.status))return void res.status(409).json({success:false,error:{message:"Only failed or approval-required runs can be retried."}});const updated=await prisma.aIAutomationRun.update({where:{id:run.id},data:{status:"QUEUED",error:null,finishedAt:null}});res.status(202).json({success:true,data:updated});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to retry automation run."}});}}
export async function listAutomationRuns(req:Request,res:Response){try{const automationId=String(req.params.id);res.json({success:true,data:await prisma.aIAutomationRun.findMany({where:{automationId},orderBy:{createdAt:"desc"},take:50})});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load automation runs."}});}}
export async function brainProfile(req:Request,res:Response){try{const agentId=String(req.params.agentId);const agent=await prisma.aIAgent.findUnique({where:{id:agentId},include:{brainCategories:{include:{metrics:{orderBy:{metricDate:"asc"},take:90}},orderBy:{key:"asc"}}}});if(!agent)return void res.status(404).json({success:false,error:{message:"Agent not found."}});const categories=await Promise.all(agent.brainCategories.map(async c=>{const [knowledgeCount,memoryCount]=await Promise.all([prisma.aIAgentKnowledge.count({where:{agentId,categoryId:c.id}}),prisma.aIAgentMemory.count({where:{agentId,categoryId:c.id}})]);const dataCount=knowledgeCount+memoryCount;const progress=Math.min(100,Math.round((knowledgeCount+memoryCount+c.dataCount)/Math.max(1,10+c.dataCount)*100));await prisma.aIAgentBrainCategory.update({where:{id:c.id},data:{knowledgeCount,memoryCount,dataCount,progress}});await prisma.aIBrainMetric.create({data:{categoryId:c.id,progress,dataCount,memoryCount,knowledgeCount}});return {...c,knowledgeCount,memoryCount,dataCount,progress};}));const overall=categories.length?Math.round(categories.reduce((sum,c)=>sum+c.progress,0)/categories.length):0;res.json({success:true,data:{agent:{id:agent.id,name:agent.name,status:agent.status},overall,categories}});}catch(error){res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load brain profile."}});}}
export async function linkKnowledgeToAgent(req:Request,res:Response){try{const agentId=String(req.params.agentId),knowledgeId=String(req.body?.knowledgeId),categoryId=typeof req.body?.categoryId==="string"?req.body.categoryId:undefined;if(!knowledgeId)return void res.status(400).json({success:false,error:{message:"knowledgeId is required."}});const link=await prisma.aIAgentKnowledge.upsert({where:{agentId_knowledgeId:{agentId,knowledgeId}},update:{categoryId},create:{agentId,knowledgeId,categoryId}});res.status(201).json({success:true,data:link});}catch(error){res.status(400).json({success:false,error:{message:error instanceof Error?error.message:"Unable to link knowledge."}});}}
export async function linkMemoryToAgent(req:Request,res:Response){try{const agentId=String(req.params.agentId),memoryId=String(req.body?.memoryId),categoryId=typeof req.body?.categoryId==="string"?req.body.categoryId:undefined;if(!memoryId)return void res.status(400).json({success:false,error:{message:"memoryId is required."}});const link=await prisma.aIAgentMemory.upsert({where:{agentId_memoryId:{agentId,memoryId}},update:{categoryId},create:{agentId,memoryId,categoryId}});res.status(201).json({success:true,data:link});}catch(error){res.status(400).json({success:false,error:{message:error instanceof Error?error.message:"Unable to link memory."}});}}

export async function getAgent(req:Request,res:Response){
  try{
    const agent=await prisma.aIAgent.findUnique({
      where:{id:String(req.params.id)},
      include:{brainCategories:{orderBy:{key:"asc"}},_count:{select:{runs:true,jobs:true,automations:true}}}
    });
    if(!agent)return void res.status(404).json({success:false,error:{message:"Agent not found."}});
    res.json({success:true,data:agent});
  }catch(error){
    res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load agent."}});
  }
}
export async function createAgent(req:Request,res:Response){
  const {key,name,description,systemPrompt,status}=req.body??{};
  if(typeof key!=="string"||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key.trim()))return void res.status(400).json({success:false,error:{message:"key must use lowercase letters, numbers and hyphens."}});
  if(typeof name!=="string"||!name.trim()||typeof description!=="string"||!description.trim()||typeof systemPrompt!=="string"||!systemPrompt.trim())return void res.status(400).json({success:false,error:{message:"name, description and systemPrompt are required."}});
  if(status!==undefined&&!["ACTIVE","PAUSED","DISABLED"].includes(String(status)))return void res.status(400).json({success:false,error:{message:"Invalid agent status."}});
  try{
    const agent=await prisma.aIAgent.create({data:{key:key.trim(),name:name.trim(),description:description.trim(),systemPrompt:systemPrompt.trim(),status:status??"ACTIVE"}});
    const categories=[["knowledge","Knowledge","Verified information available to the agent."],["memory","Memory","Persistent useful context learned from interactions."],["website","Website","Website structure, content and operational knowledge."],["content","Content","Content patterns, drafts, preferences and history."],["automation","Automation","Automation rules, workflows and execution patterns."],["tasks","Tasks","Task history, outcomes and reusable task context."]];
    await prisma.aIAgentBrainCategory.createMany({data:categories.map(([categoryKey,categoryName,categoryDescription])=>({agentId:agent.id,key:categoryKey,name:categoryName,description:categoryDescription}))});
    res.status(201).json({success:true,data:agent});
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to create agent.";
    res.status(message.toLowerCase().includes("unique")?409:500).json({success:false,error:{message}});
  }
}
export async function updateAgent(req:Request,res:Response){
  const id=String(req.params.id);
  const {name,description,systemPrompt,status}=req.body??{};
  if(status!==undefined&&!["ACTIVE","PAUSED","DISABLED"].includes(String(status)))return void res.status(400).json({success:false,error:{message:"Invalid agent status."}});
  const data:any={};
  if(typeof name==="string"&&name.trim())data.name=name.trim();
  if(typeof description==="string")data.description=description.trim();
  if(typeof systemPrompt==="string"&&systemPrompt.trim())data.systemPrompt=systemPrompt.trim();
  if(status!==undefined)data.status=status;
  if(!Object.keys(data).length)return void res.status(400).json({success:false,error:{message:"No valid agent changes supplied."}});
  try{
    const agent=await prisma.aIAgent.update({where:{id},data});
    res.json({success:true,data:agent});
  }catch(error){
    res.status(404).json({success:false,error:{message:error instanceof Error?error.message:"Agent not found."}});
  }
}
export async function listAgentRuns(req:Request,res:Response){
  try{
    const agent=await prisma.aIAgent.findUnique({where:{id:String(req.params.id)},select:{id:true}});
    if(!agent)return void res.status(404).json({success:false,error:{message:"Agent not found."}});
    const runs=await prisma.aIAgentRun.findMany({where:{agentId:agent.id},orderBy:{createdAt:"desc"},take:100});
    res.json({success:true,data:runs});
  }catch(error){
    res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load agent runs."}});
  }
}


export async function runAgentChain(req:Request,res:Response){
  const agentIds=Array.isArray(req.body?.agentIds)?req.body.agentIds.filter((id:unknown):id is string=>typeof id==="string"):[];
  if(agentIds.length<2)return void res.status(400).json({success:false,error:{message:"agentIds must contain at least two agents."}});
  try{
    let current:unknown=req.body?.input??{};
    const runs=[];
    for(const agentId of agentIds){
      const result=await runAgent(agentId,{source:"agent-chain",input:current});
      runs.push(result);
      current=result.output??result;
    }
    res.status(202).json({success:true,data:{output:current,runs}});
  }catch(error){
    res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Agent chain execution failed."}});
  }
}

export async function controlCenter(req:Request,res:Response){
  try{
    const [agents,automations,conversations,knowledge,memories]=await Promise.all([
      prisma.aIAgent.findMany({orderBy:{createdAt:"asc"}}),
      prisma.aIAutomation.findMany({orderBy:{updatedAt:"desc"},take:50}),
      prisma.aIConversation.findMany({orderBy:{updatedAt:"desc"},take:20}),
      prisma.aIKnowledgeDocument.findMany({orderBy:{updatedAt:"desc"},take:20,select:{id:true,title:true,source:true,updatedAt:true,embedding:true}}),
      prisma.aIMemory.findMany({orderBy:{updatedAt:"desc"},take:20,select:{id:true,namespace:true,updatedAt:true,embedding:true}})
    ]);
    const keyStatus={
      knowledge:Boolean(process.env["My-Project Knowledge"]||process.env.OPENAI_API_KEY),
      agent:Boolean(process.env["My-Project AI Agent"]||process.env.OPENAI_API_KEY),
      production:Boolean(process.env["My-Project Production AI"]||process.env.OPENAI_API_KEY)
    };
    res.json({success:true,data:{
      keyStatus,
      summary:{
        agents:agents.length,
        activeAgents:agents.filter(a=>a.status==="ACTIVE").length,
        automations:automations.length,
        conversations:conversations.length,
        knowledge:knowledge.length,
        indexedKnowledge:knowledge.filter(k=>k.embedding!==null).length,
        memories:memories.length,
        embeddedMemories:memories.filter(m=>m.embedding!==null).length
      },
      agents,automations,conversations,knowledge,memories
    }});
  }catch(error){
    res.status(500).json({success:false,error:{message:error instanceof Error?error.message:"Unable to load AI control center."}});
  }
}

export async function reindexKnowledgeRoute(_req:Request,res:Response){try{res.json({success:true,data:await reindexKnowledge()});}catch(error){res.status(503).json({success:false,error:{message:error instanceof Error?error.message:"Knowledge reindex failed."}});}}

