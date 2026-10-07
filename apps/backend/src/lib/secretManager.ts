type SecretTarget="railway"|"render";
type TargetConfig={railway?:{token:string;projectId:string;environmentId:string;serviceId:string};render?:{token:string;serviceId:string}};
function jsonHeaders(token:string){return {Authorization:`Bearer ${token}`,"Content-Type":"application/json"};}
async function railwaySet(cfg:NonNullable<TargetConfig["railway"]>,key:string,value:string){
 const query=`mutation variableUpsert($input: VariableUpsertInput!) { variableUpsert(input: $input) }`;
 const response=await fetch("https://backboard.railway.com/graphql/v2",{method:"POST",headers:jsonHeaders(cfg.token),body:JSON.stringify({query,variables:{input:{projectId:cfg.projectId,environmentId:cfg.environmentId,serviceId:cfg.serviceId,name:key,value}}})});
 const body=await response.text(); if(!response.ok)throw new Error(`Railway secret sync failed: ${response.status}`);
 const data=JSON.parse(body); if(data.errors?.length)throw new Error(data.errors[0]?.message??"Railway secret sync failed.");
}
async function renderSet(cfg:NonNullable<TargetConfig["render"]>,key:string,value:string){
 const response=await fetch(`https://api.render.com/v1/services/${encodeURIComponent(cfg.serviceId)}/env-vars/${encodeURIComponent(key)}`,{method:"PUT",headers:jsonHeaders(cfg.token),body:JSON.stringify({value})});
 if(!response.ok)throw new Error(`Render secret sync failed: ${response.status}`);
 const deploy=await fetch(`https://api.render.com/v1/services/${encodeURIComponent(cfg.serviceId)}/deploys`,{method:"POST",headers:jsonHeaders(cfg.token),body:JSON.stringify({deployMode:"deploy_only"})});
 if(!deploy.ok)throw new Error(`Render redeploy after secret sync failed: ${deploy.status}`);
}
export async function syncSecret(key:string,value:string,target:SecretTarget){
 if(!value)throw new Error("Secret value is empty.");
 if(target==="railway"){
  const cfg={token:process.env.RAILWAY_API_TOKEN,projectId:process.env.RAILWAY_PROJECT_ID,environmentId:process.env.RAILWAY_ENVIRONMENT_ID,serviceId:process.env.RAILWAY_SERVICE_ID};
  if(Object.values(cfg).some(v=>!v))throw new Error("Railway secret integration is not configured.");
  await railwaySet(cfg as any,key,value); return;
 }
 const cfg={token:process.env.RENDER_API_KEY,serviceId:process.env.RENDER_SERVICE_ID};
 if(!cfg.token||!cfg.serviceId)throw new Error("Render secret integration is not configured.");
 await renderSet(cfg,key,value);
}
export function secretIntegrationStatus(){
 return {
  railway:Boolean(process.env.RAILWAY_API_TOKEN&&process.env.RAILWAY_PROJECT_ID&&process.env.RAILWAY_ENVIRONMENT_ID&&process.env.RAILWAY_SERVICE_ID),
  render:Boolean(process.env.RENDER_API_KEY&&process.env.RENDER_SERVICE_ID)
 };
}
