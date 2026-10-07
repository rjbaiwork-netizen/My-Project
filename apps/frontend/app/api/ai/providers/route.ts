import {NextRequest,NextResponse} from "next/server";
const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"")??"";
async function forward(req:NextRequest){
 if(!base)return NextResponse.json({success:false,error:{message:"Backend URL is not configured."}},{status:503});
 const target=base+"/api/ai/providers"+req.nextUrl.search;
 const response=await fetch(target,{method:req.method,headers:{Authorization:"Bearer "+(process.env.ADMIN_API_TOKEN??""),"Content-Type":"application/json"},body:req.method==="GET"?undefined:await req.text(),cache:"no-store"});
 return new NextResponse(await response.text(),{status:response.status,headers:{"Content-Type":"application/json"}});
}
export const GET=forward;
export const POST=async(req:NextRequest)=>{
 if(req.nextUrl.searchParams.get("action")==="reindex"){
  const response=await fetch(base+"/api/ai/providers/reindex-knowledge",{method:"POST",headers:{Authorization:"Bearer "+(process.env.ADMIN_API_TOKEN??"")},cache:"no-store"});
  return new NextResponse(await response.text(),{status:response.status,headers:{"Content-Type":"application/json"}});
 }
 return forward(req);
};
