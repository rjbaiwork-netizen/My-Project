import {NextRequest,NextResponse} from "next/server";
const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"")??"";
async function forward(req:NextRequest,{params}:{params:Promise<{path?:string[]}>}){
 const p=(await params).path??[];
 if(!base)return NextResponse.json({success:false,error:{message:"Backend URL is not configured."}},{status:503});
 const target=base+"/api/ai/provider-integrations"+(p.length?"/"+p.map(encodeURIComponent).join("/"):"")+req.nextUrl.search;
 const response=await fetch(target,{method:req.method,headers:{Authorization:"Bearer "+(process.env.ADMIN_API_TOKEN??""),"Content-Type":"application/json"},body:req.method==="GET"||req.method==="HEAD"?undefined:await req.text(),cache:"no-store"});
 return new NextResponse(await response.text(),{status:response.status,headers:{"Content-Type":"application/json"}});
}
export const GET=forward; export const POST=forward; export const PATCH=forward; export const DELETE=forward;
