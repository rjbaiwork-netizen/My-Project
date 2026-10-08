import {NextRequest,NextResponse} from "next/server";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"")??"";

export async function POST(req:NextRequest){
 if(!base)return NextResponse.json({success:false,error:{message:"Backend URL is not configured."}},{status:503});
 const body=await req.text();
 let response=await fetch(base+"/api/ai/control-chat",{
  method:"POST",
  headers:{
   Authorization:"Bearer "+(process.env.ADMIN_API_TOKEN??""),
   "Content-Type":"application/json"
  },
  body,
  cache:"no-store"
 });
 if(response.status===502||response.status===503||response.status===504){
  await new Promise(resolve=>setTimeout(resolve,350));
  response=await fetch(base+"/api/ai/control-chat",{
   method:"POST",
   headers:{
    Authorization:"Bearer "+(process.env.ADMIN_API_TOKEN??""),
    "Content-Type":"application/json"
   },
   body,
   cache:"no-store"
  });
 }
 return new NextResponse(await response.text(),{
  status:response.status,
  headers:{"Content-Type":response.headers.get("content-type")??"application/json","Cache-Control":"no-store"}
 });
}
