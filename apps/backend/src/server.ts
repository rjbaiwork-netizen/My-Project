import "dotenv/config";
import cors from "cors";
import express,{type ErrorRequestHandler} from "express";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import providerIntegrationRoutes from "./routes/providerIntegrationRoutes.js";
import { getAIWorkerStatus,startAIWorker } from "./workers/aiWorker.js";
import { generateAI } from "./lib/providerRouter.js";
import { prisma } from "./lib/prisma.js";
const app=express(),port=Number(process.env.PORT??4000);
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
app.listen(port,"0.0.0.0",()=>{console.log(`Backend API listening on 0.0.0.0:${port}`);startAIWorker();if(process.env.AI_FAILOVER_SMOKE_TEST==="true"){void generateAI([{role:"system",content:"You are a production failover smoke-test assistant."},{role:"user",content:"Reply with exactly: FAILOVER_SMOKE_OK"}],"production").then(answer=>console.log(`[AI_FAILOVER_SMOKE] success response=${JSON.stringify(answer.slice(0,80))}`)).catch(error=>console.error(`[AI_FAILOVER_SMOKE] failed ${error instanceof Error?error.message:String(error)}`));}});
export default app;

// Automation deployment recovery marker.

// Migration recovery path uses the backend working directory.
