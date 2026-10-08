import {NextRequest,NextResponse} from "next/server";
const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"")??"";
export async function POST(req:NextRequest){
 if(!base)return NextResponse.json({success:false,error:{message:"Backend URL is not configured."}},{status:503});
 const response=await fetch(base+"/api/ai/control-chat",{method:"POST",headers:{Authorization:"Bearer "+(process.env.ADMIN_API_TOKEN??""),"Content-Type":"application/json"},body:await req.text(),cache:"no-store"});
 return new NextResponse(await response.text(),{status:response.status,headers:{"Content-Type":"application/json"}});
}