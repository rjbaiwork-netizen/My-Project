import type {Request,Response} from "express";
import {prisma} from "../lib/prisma.js";
import {getIntegrationSpec,PROVIDER_INTEGRATIONS} from "../lib/providerIntegrations.js";
import {secretIntegrationStatus,syncSecret} from "../lib/secretManager.js";
import {randomUUID} from "node:crypto";
export async function listIntegrations(_req:Request,res:Response){
 const connections=await prisma.aIProviderConnection.findMany({orderBy:{providerId:"asc"}});
 res.json({success:true,data:{providers:PROVIDER_INTEGRATIONS.map(p=>{const c=connections.find(x=>x.providerId===p.id);return {...p,connected:Boolean(c&&c.status==="CONNECTED"),status:c?.status??"DISCONNECTED",lastError:c?.lastError??null,connectedAt:c?.connectedAt??null};}),secretTargets:secretIntegrationStatus()}});
}
export async function beginIntegration(req:Request,res:Response){
 const providerId=String(req.params.providerId),spec=getIntegrationSpec(providerId);
 if(!spec)return void res.status(404).json({success:false,error:{message:"Provider integration not found."}});
 const state=randomUUID();
 await prisma.aIProviderConnection.upsert({where:{providerId},update:{status:"AUTHORIZING",lastError:null,externalRef:state},create:{providerId,displayName:spec.name,authType:spec.mode,status:"AUTHORIZING",externalRef:state,capabilities:spec.capabilities,secretTargets:spec.secretKeys}});
 if(spec.mode==="oauth"){
  const clientId=process.env.GEMINI_OAUTH_CLIENT_ID;
  const redirectUri=process.env.GEMINI_OAUTH_REDIRECT_URI;
  if(!clientId||!redirectUri)return void res.status(503).json({success:false,error:{message:"OAuth integration is not configured for this provider."}});
  const url=new URL(spec.authUrl!);url.searchParams.set("client_id",clientId);url.searchParams.set("redirect_uri",redirectUri);url.searchParams.set("response_type","code");url.searchParams.set("scope","https://www.googleapis.com/auth/cloud-platform");url.searchParams.set("access_type","offline");url.searchParams.set("prompt","consent");url.searchParams.set("state",state);
  return void res.json({success:true,data:{mode:"oauth",authorizationUrl:url.toString(),state,providerId}});
 }
 if(spec.mode==="api-key-management"){
  const managementKey=process.env.OPENROUTER_MANAGEMENT_KEY;
  if(!managementKey)return void res.json({success:true,data:{mode:"bootstrap-required",providerId,requiredSecret:"OPENROUTER_MANAGEMENT_KEY",message:"A provider management credential must be bootstrapped once; this is not the workload API key."}});
  try{
    const response=await fetch("https://openrouter.ai/api/v1/keys",{method:"POST",headers:{"Authorization":`Bearer ${managementKey}`,"Content-Type":"application/json"},body:JSON.stringify({name:"My-Project Production AI",limit:0,limit_reset:"monthly"})});
    const body=await response.text();if(!response.ok)throw new Error(`OpenRouter key provisioning failed: ${response.status}`);
    const data=JSON.parse(body);const key=data.key;if(typeof key!=="string")throw new Error("OpenRouter did not return a workload API key.");
    await syncSecret(spec.secretKeys[0],key,"railway");
    await prisma.aIProviderConnection.upsert({where:{providerId},update:{displayName:spec.name,status:"CONNECTED",authType:"api-key-management",secretTargets:[{target:"railway",key:spec.secretKeys[0]}],externalRef:data.data?.hash??null,lastError:null,connectedAt:new Date(),lastValidatedAt:new Date(),capabilities:spec.capabilities},create:{providerId,displayName:spec.name,authType:"api-key-management",status:"CONNECTED",secretTargets:[{target:"railway",key:spec.secretKeys[0]}],externalRef:data.data?.hash??null,connectedAt:new Date(),lastValidatedAt:new Date(),capabilities:spec.capabilities}});
    await prisma.aIProviderEvent.create({data:{provider:providerId,purpose:"production",operation:"credential-provision",success:true,latencyMs:0}});
    return void res.json({success:true,data:{providerId,status:"CONNECTED",mode:"api-key-management",target:"railway"}});
  }catch(error){return void res.status(503).json({success:false,error:{message:error instanceof Error?error.message:"Provider key provisioning failed."}});}
}
 res.json({success:true,data:{mode:spec.mode,providerId,docsUrl:spec.docsUrl,automatedKeyCreation:spec.automatedKeyCreation}});
}
export async function storeProviderSecret(req:Request,res:Response){
 const providerId=String(req.params.providerId),spec=getIntegrationSpec(providerId);
 const value=typeof req.body?.value==="string"?req.body.value.trim():"";
 const target=req.body?.target==="render"?"render":"railway";
 if(!spec||!value)return void res.status(400).json({success:false,error:{message:"provider and credential value are required."}});
 try{
  const key=spec.secretKeys[0]; await syncSecret(key,value,target);
  await prisma.aIProviderConnection.upsert({where:{providerId},update:{displayName:spec.name,status:"CONNECTED",authType:"api-key",secretTargets:[{target,key}],lastError:null,connectedAt:new Date(),lastValidatedAt:new Date()},create:{providerId,displayName:spec.name,authType:"api-key",status:"CONNECTED",secretTargets:[{target,key}],connectedAt:new Date(),lastValidatedAt:new Date(),capabilities:spec.capabilities}});
  await prisma.aIProviderEvent.create({data:{provider:providerId,purpose:"production",operation:"credential-sync",success:true,latencyMs:0}});
  res.json({success:true,data:{providerId,status:"CONNECTED",target,key}});
 }catch(error){await prisma.aIProviderEvent.create({data:{provider:providerId,purpose:"production",operation:"credential-sync",success:false,error:error instanceof Error?error.message:"credential sync failed",latencyMs:0}});res.status(503).json({success:false,error:{message:error instanceof Error?error.message:"Credential sync failed."}});}
}
