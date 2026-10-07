import { prisma } from "../lib/prisma.js";
import { generateAI, retrieveKnowledge } from "../lib/ai.js";
import { runAgent } from "../lib/agentOrchestrator.js";

let running=false;
let workerStarted=false;
let lastTickAt:Date|null=null;
let lastError:string|null=null;

type JsonRecord=Record<string,unknown>;

function getPath(input:unknown,path:string):unknown{
  return path.split(".").reduce<unknown>((value,key)=>{
    if(value&&typeof value==="object")return (value as JsonRecord)[key];
    return undefined;
  },input);
}

function compareCondition(input:unknown,condition:JsonRecord):boolean{
  const actual=getPath(input,String(condition.field??""));
  const operator=String(condition.operator??"equals").toLowerCase();
  const expected=condition.value;
  if(operator==="exists")return actual!==undefined&&actual!==null;
  if(operator==="not-exists")return actual===undefined||actual===null;
  if(operator==="is-empty")return actual===undefined||actual===null||actual==="";
  if(operator==="is-not-empty")return !(actual===undefined||actual===null||actual==="");
  if(operator==="contains")return String(actual??"").toLowerCase().includes(String(expected??"").toLowerCase());
  if(operator==="not-contains")return !String(actual??"").toLowerCase().includes(String(expected??"").toLowerCase());
  if(operator==="gt")return Number(actual)>Number(expected);
  if(operator==="gte")return Number(actual)>=Number(expected);
  if(operator==="lt")return Number(actual)<Number(expected);
  if(operator==="lte")return Number(actual)<=Number(expected);
  if(operator==="not-equals"||operator==="!=")return String(actual??"")!==String(expected??"");
  return String(actual??"")===String(expected??"");
}

function conditionsPass(input:unknown,conditions:unknown):boolean{
  if(!Array.isArray(conditions)||conditions.length===0)return true;
  const mode=String((conditions as JsonRecord[])[0]?.logic??"AND").toUpperCase();
  const checks=(conditions as JsonRecord[]).map(condition=>compareCondition(input,condition));
  return mode==="OR"?checks.some(Boolean):checks.every(Boolean);
}

async function executeAction(action:JsonRecord,output:unknown,automationId:string,runId:string):Promise<unknown>{
  const type=String(action.type??"");
  if(type==="run-agent"){
    const agentId=typeof action.agentId==="string"?action.agentId:undefined;
    if(!agentId)throw new Error("run-agent action requires an agent.");
    return runAgent(agentId,{input:output,automationId,runId});
  }
  if(type==="run-agent-chain"){
    const agents=Array.isArray(action.agentIds)?action.agentIds.filter((id):id is string=>typeof id==="string"):[];
    if(!agents.length)throw new Error("run-agent-chain requires at least one agentId.");
    let current=output;
    for(const agentId of agents)current=await runAgent(agentId,{input:current,automationId,runId});
    return current;
  }
  if(type==="store-memory"){
    const content=typeof action.content==="string"?action.content:JSON.stringify(output);
    const memory=await prisma.aIMemory.create({data:{namespace:"automation",content,metadata:{automationId,runId}}});
    return {storedMemoryId:memory.id,value:output};
  }
  if(type==="create-task"){
    const agentId=typeof action.agentId==="string"?action.agentId:undefined;
    const job=await prisma.aIJob.create({data:{type:typeof action.taskType==="string"?action.taskType:"automation-task",payload:{input:output as any,automationId,runId},agentId:agentId||undefined,status:"QUEUED",scheduledAt:new Date()}});
    return {taskId:job.id,value:output};
  }
  if(type==="generate-content"){
    const prompt=typeof action.prompt==="string"?action.prompt:`Generate content from this automation input: ${JSON.stringify(output)}`;
    const text=await generateAI([{role:"system",content:"Generate only the requested content."},{role:"user",content:prompt}]);
    return {text};
  }
  if(type==="search-knowledge"){
    const query=typeof action.query==="string"?action.query:JSON.stringify(output);
    return await retrieveKnowledge(query,Number(action.limit??5));
  }
  if(type==="update-content"){
    const key=typeof action.sectionKey==="string"?action.sectionKey.toUpperCase():String((output as JsonRecord)?.sectionKey??"").toUpperCase();
    if(!key)throw new Error("update-content requires sectionKey.");
    const content=action.content??(output as JsonRecord)?.content??output;
    const section=await prisma.cMSSection.findUnique({where:{key:key as any}});
    if(!section)throw new Error(`CMS section not found: ${key}`);
    const updated=await prisma.cMSSection.update({where:{id:section.id},data:{content:content as any}});
    return {sectionId:updated.id,sectionKey:updated.key,value:content};
  }
  if(type==="send-notification"){
    const message=typeof action.message==="string"?action.message:JSON.stringify(output);
    const notification=await prisma.aIMemory.create({data:{namespace:"automation-notification",content:message,metadata:{automationId,runId,channel:typeof action.channel==="string"?action.channel:"internal"}}});
    return {notificationId:notification.id,value:output};
  }
  if(type==="start-automation"||type==="stop-automation"){
    const targetId=typeof action.automationId==="string"?action.automationId:automationId;
    const updated=await prisma.aIAutomation.update({where:{id:targetId},data:{status:type==="start-automation"?"ACTIVE":"PAUSED"}});
    return {automationId:updated.id,status:updated.status,value:output};
  }
  if(type==="request-approval")return output;
  throw new Error(`Unsupported automation action: ${type}`);
}

async function executeAutomationRun(runId:string){
  const run=await prisma.aIAutomationRun.findUnique({where:{id:runId},include:{automation:true}});
  if(!run||run.status==="APPROVAL_REQUIRED")return;

  const input=(run.input??{}) as JsonRecord;
  if(!conditionsPass(input,run.automation.conditions))return void await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"SUCCEEDED",output:{skipped:true,reason:"Conditions not met"},finishedAt:new Date()}});

  const existingSteps=Array.isArray(run.steps)?run.steps as JsonRecord[]:[];
  const steps=[...existingSteps];
  await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"RUNNING",startedAt:run.startedAt??new Date(),attempts:{increment:1}}});

  try{
    let output:unknown=run.input??{};
    const actions=Array.isArray(run.automation.actions)?run.automation.actions as JsonRecord[]:[];
    const approvalApproved=input.approvalApproved===true;

    if(!approvalApproved&&((run.automation.approval as JsonRecord|null)?.required===true||actions.some(action=>action.type==="request-approval"))){
      steps.push({type:"approval",status:"WAITING",message:"Approval required before execution."});
      await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"APPROVAL_REQUIRED",steps:steps as any,output:output as any}});
      return;
    }

    for(let index=0;index<actions.length;index++){
      const action=actions[index];
      if(action.type==="request-approval")continue;
      const step={index,type:String(action.type??""),status:"RUNNING",startedAt:new Date().toISOString()};
      steps.push(step);
      await prisma.aIAutomationRun.update({where:{id:runId},data:{steps:steps as any}});
      try{
        output=await executeAction(action,output,run.automationId,runId);
        Object.assign(step,{status:"SUCCEEDED",finishedAt:new Date().toISOString()});
      }catch(error){
        Object.assign(step,{status:"FAILED",finishedAt:new Date().toISOString(),error:error instanceof Error?error.message:"Action failed"});
        throw error;
      }
      await prisma.aIAutomationRun.update({where:{id:runId},data:{steps:steps as any}});
    }
    await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"SUCCEEDED",output:output as any,steps:steps as any,finishedAt:new Date(),error:null}});
  }catch(error){
    const message=error instanceof Error?error.message:"Automation failed.";
    const nextAttempts=run.attempts+1;
    if(nextAttempts<run.maxAttempts){
      await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"QUEUED",error:`Retry scheduled: ${message}`,steps:steps as any}});
    }else{
      await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"FAILED",error:message,steps:steps as any,finishedAt:new Date()}});
    }
  }
}

export async function startAIWorker(intervalMs=15000){
  const tick=async()=>{
    if(running)return;
    running=true;
    lastTickAt=new Date();
    lastError=null;
    try{
      const automationRun=await prisma.aIAutomationRun.findFirst({where:{status:"QUEUED"},orderBy:{createdAt:"asc"}});
      if(automationRun)await executeAutomationRun(automationRun.id);

      const job=await prisma.aIJob.findFirst({where:{status:"QUEUED",OR:[{scheduledAt:null},{scheduledAt:{lte:new Date()}}]},orderBy:{createdAt:"asc"}});
      if(job){
        await prisma.aIJob.update({where:{id:job.id},data:{status:"RUNNING",attempts:{increment:1}}});
        try{
          if(!job.agentId)throw new Error("AI job has no agentId.");
          await runAgent(job.agentId,job.payload);
          await prisma.aIJob.update({where:{id:job.id},data:{status:"SUCCEEDED",lastError:null}});
        }catch(error){
          await prisma.aIJob.update({where:{id:job.id},data:{status:"FAILED",lastError:error instanceof Error?error.message:"AI job failed."}});
        }
      }

      const scheduled=await prisma.aIAutomation.findMany({where:{status:"ACTIVE",trigger:{path:["type"],equals:"schedule"}},take:10});
      for(const automation of scheduled){
        const intervalSeconds=Number((automation.trigger as JsonRecord)?.intervalSeconds??0);
        if(intervalSeconds>0){
          const last=await prisma.aIAutomationRun.findFirst({where:{automationId:automation.id},orderBy:{createdAt:"desc"}});
          if(!last||Date.now()-last.createdAt.getTime()>=intervalSeconds*1000)await prisma.aIAutomationRun.create({data:{automationId:automation.id,status:"QUEUED",input:{trigger:"schedule"}}});
        }
      }
    }catch(error){
      lastError=error instanceof Error?error.message:"Automation worker tick failed.";
      console.error("[automation-worker]",lastError);
    }finally{running=false;}
  };
  workerStarted=true;
  void tick();
  return setInterval(()=>void tick(),intervalMs);
}

export function getAIWorkerStatus(){
  return {started:workerStarted,running,lastTickAt:lastTickAt?.toISOString()??null,lastError};
}

// Automation engine live validation marker.
