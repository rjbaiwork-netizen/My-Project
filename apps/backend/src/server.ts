import "dotenv/config";
import cors from "cors";
import express,{type ErrorRequestHandler} from "express";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import providerIntegrationRoutes from "./routes/providerIntegrationRoutes.js";
import { getAIWorkerStatus,startAIWorker } from "./workers/aiWorker.js";
import { prisma } from "./lib/prisma.js";
const app=express(),port=Number(process.env.PORT??4000);
async function runScheduleSmokeTest(){
 if(process.env.SCHEDULE_E2E_SMOKE!=="true")return;
 const now=new Date(); const hh=now.getHours().toString().padStart(2,"0"); const mm=((now.getMinutes()+59)%60).toString().padStart(2,"0");
 const day=now.getDay(); const date=now.getDate();
 const specs=[
  {name:"__SMOKE_INTERVAL__",trigger:{type:"schedule",mode:"interval",intervalSeconds:60}},
  {name:"__SMOKE_ONCE__",trigger:{type:"schedule",mode:"once",at:new Date(Date.now()+20000).toISOString()}},
  {name:"__SMOKE_DAILY__",trigger:{type:"schedule",mode:"daily",time:`${hh}:${mm}`}},
  {name:"__SMOKE_WEEKLY__",trigger:{type:"schedule",mode:"weekly",dayOfWeek:day,time:`${hh}:${mm}`}},
  {name:"__SMOKE_MONTHLY__",trigger:{type:"schedule",mode:"monthly",dayOfMonth:date,time:`${hh}:${mm}`}}
 ];
 const created:Array<{id:string;name:string}>=[];
 for(const s of specs){created.push(await prisma.aIAutomation.create({data:{name:s.name,description:"temporary production scheduler smoke test",status:"ACTIVE",trigger:s.trigger,conditions:[],actions:[{type:"send-notification",message:s.name}],approval:{required:false}}}));}
 console.log("[SCHEDULE_E2E] created="+created.map(x=>x.name).join(","));
 setTimeout(async()=>{try{const runs=await prisma.aIAutomationRun.findMany({where:{automationId:{in:created.map(x=>x.id)}},orderBy:{createdAt:"asc"},select:{status:true,automationId:true,error:true,finishedAt:true}});const summary=created.map(a=>({name:a.name,runs:runs.filter(r=>r.automationId===a.id).map(r=>({status:r.status,error:r.error}))}));console.log("[SCHEDULE_E2E] results="+JSON.stringify(summary));await prisma.aIAutomation.deleteMany({where:{id:{in:created.map(x=>x.id)}}});console.log("[SCHEDULE_E2E] cleanup=SUCCESS");}catch(error){console.error("[SCHEDULE_E2E] failed "+(error instanceof Error?error.message:String(error)));}},50000);
}

if(!Number.isInteger(port)||port<=0||port>65535)throw new Error("PORT must be a valid TCP port.");
app.disable("x-powered-by");
app.use((req,res,next)=>{res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("X-Frame-Options","DENY");res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");res.setHeader("Permissions-Policy","camera=(), microphone=(), geolocation=()");next();});
app.use(cors({origin:process.env.CORS_ORIGIN?.split(",").map(o=>o.trim())??true,credentials:true}));
app.use(express.json({limit:"1mb"}));
app.get("/health",(_req,res)=>res.json({success:true,status:"ok",automationEngineVersion:"2.0"}));
app.get("/ready",async(_req,res)=>{try{await prisma.$queryRaw`SELECT 1`;const worker=getAIWorkerStatus();const ready=worker.started&&!worker.lastError;res.status(ready?200:503).json({success:ready,status:ready?"ready":"not_ready",automationEngineVersion:"2.0",database:"ready",worker});}catch(error){res.status(503).json({success:false,status:"not_ready",automationEngineVersion:"2.0",database:"unavailable",worker:getAIWorkerStatus(),error:error instanceof Error?error.message:"Database readiness check failed."});}});
app.use("/api",adminRoutes);
app.use("/api/ai",aiRoutes);
app.use("/api/ai/provider-integrations",providerIntegrationRoutes);
app.use((_req,res)=>res.status(404).json({success:false,error:{message:"Route not found."}}));
const errorHandler:ErrorRequestHandler=(error,_req,res,_next)=>{console.error(error);if(error instanceof SyntaxError&&"body" in error)return void res.status(400).json({success:false,error:{message:"Invalid JSON payload."}});res.status(500).json({success:false,error:{message:"Internal server error."}});};
app.use(errorHandler);
app.listen(port,"0.0.0.0",()=>{console.log(`Backend API listening on 0.0.0.0:${port}`);startAIWorker();void runScheduleSmokeTest();});
export default app;

// Automation deployment recovery marker.

// Migration recovery path uses the backend working directory.
