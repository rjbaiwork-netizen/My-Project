import { prisma } from "../lib/prisma.js";
import { runAgent } from "../lib/agentOrchestrator.js";
let running=false;
async function executeAutomationRun(runId:string){
  const run=await prisma.aIAutomationRun.findUnique({where:{id:runId},include:{automation:true}});
  if(!run)return;
  await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"RUNNING",startedAt:new Date()}});
  try{
    const actions=Array.isArray(run.automation.actions)?run.automation.actions as Array<Record<string,unknown>>:[];
    let output:unknown=run.input??{};
    for(const action of actions){
      const type=String(action.type??"");
      if(type==="run-agent"){
        const agentId=typeof action.agentId==="string"?action.agentId:run.automation.agentId;
        if(!agentId)throw new Error("run-agent action requires an agent.");
        output=await runAgent(agentId,{input:output,automationId:run.automationId});
      }else if(type==="store-memory"){
        const content=typeof action.content==="string"?action.content:JSON.stringify(output);
        await prisma.aIMemory.create({data:{namespace:"automation",content,metadata:{automationId:run.automationId,runId}}});
      }else if(type==="create-task"){
        const agentId=typeof action.agentId==="string"?action.agentId:run.automation.agentId;
        await prisma.aIJob.create({data:{type:typeof action.taskType==="string"?action.taskType:"automation-task",payload:{input:output,automationId:run.automationId},agentId:agentId||undefined,status:"QUEUED",scheduledAt:new Date()}});
      }else{
        throw new Error(`Unsupported automation action: ${type}`);
      }
    }
    await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"SUCCEEDED",output:output as any,finishedAt:new Date(),error:null}});
  }catch(error){await prisma.aIAutomationRun.update({where:{id:runId},data:{status:"FAILED",error:error instanceof Error?error.message:"Automation failed.",finishedAt:new Date()}});}
}
export function startAIWorker(intervalMs=15000){const tick=async()=>{if(running)return;running=true;try{
  const job=await prisma.aIJob.findFirst({where:{status:"QUEUED",OR:[{scheduledAt:null},{scheduledAt:{lte:new Date()}}]},orderBy:{createdAt:"asc"}});
  if(job){await prisma.aIJob.update({where:{id:job.id},data:{status:"RUNNING",attempts:{increment:1}}});try{if(!job.agentId)throw new Error("AI job has no agentId.");await runAgent(job.agentId,job.payload);await prisma.aIJob.update({where:{id:job.id},data:{status:"SUCCEEDED",lastError:null}});}catch(error){await prisma.aIJob.update({where:{id:job.id},data:{status:"FAILED",lastError:error instanceof Error?error.message:"AI job failed."}});}}
  const automationRun=await prisma.aIAutomationRun.findFirst({where:{status:"QUEUED"},orderBy:{createdAt:"asc"}});
  if(automationRun)await executeAutomationRun(automationRun.id);
  const scheduled=await prisma.aIAutomation.findMany({where:{status:"ACTIVE",trigger:{path:["type"],equals:"schedule"}},take:10});
  for(const automation of scheduled){
    const intervalSeconds=Number((automation.trigger as any)?.intervalSeconds??0);
    if(intervalSeconds>0){
      const last=await prisma.aIAutomationRun.findFirst({where:{automationId:automation.id},orderBy:{createdAt:"desc"}});
      if(!last||Date.now()-last.createdAt.getTime()>=intervalSeconds*1000)await prisma.aIAutomationRun.create({data:{automationId:automation.id,status:"QUEUED",input:{trigger:"schedule"}}});
    }
  }
}finally{running=false;}};void tick();return setInterval(()=>void tick(),intervalMs);}
