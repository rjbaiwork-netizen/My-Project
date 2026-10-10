import {NextRequest,NextResponse} from "next/server";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const base=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"")??"";

export async function POST(_req:NextRequest){
  // This endpoint holds the server-side ADMIN_API_TOKEN. Until a real admin
  // session is verified here, it must not act as a public privileged relay.
  if(process.env.ADMIN_CONTROL_PROXY_ENABLED!=="true"){
    return NextResponse.json(
      {success:false,error:{message:"AI Control Chat is temporarily locked until admin-session authorization is configured."}},
      {status:503,headers:{"Cache-Control":"no-store"}}
    );
  }
  // Enabling this flag alone is not an authentication mechanism. The request
  // must carry a verified server-issued admin session in future revisions.
  return NextResponse.json(
    {success:false,error:{message:"Admin-session authorization is not implemented; privileged control requests are denied."}},
    {status:503,headers:{"Cache-Control":"no-store"}}
  );
}
