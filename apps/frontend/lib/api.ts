import type { CMSSection, SectionKey, UpdateSectionRequest } from "@my-project/shared";
export type { CMSSection, SectionKey } from "@my-project/shared";
interface ApiResponse<T>{success:boolean;data:T;error?:{message:string}};
const API_BASE_URL=process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/,"")??"";
async function request<T>(path:string,init?:RequestInit,base=API_BASE_URL):Promise<T>{
  const headers=new Headers(init?.headers);
  if(init?.body!==undefined)headers.set("Content-Type","application/json");
  const response=await fetch(`${base}${path}`,{...init,headers,cache:"no-store"});
  if(response.status===204)return undefined as T;
  const body=(await response.json().catch(()=>null)) as ApiResponse<T>|null;
  if(!response.ok||!body?.success)throw new Error(body?.error?.message??`Request failed with status ${response.status}.`);
  return body.data;
}
const adminRequest=<T>(path:string,init?:RequestInit)=>request<T>(path,init,"");
export const sectionApi={
  getPublicSections:()=>request<CMSSection[]>("/api/sections"),
  getAdminSections:()=>adminRequest<CMSSection[]>("/api/admin/sections"),
  updateSection:(id:string,payload:UpdateSectionRequest)=>adminRequest<CMSSection>(`/api/admin/sections/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify(payload)}),
  setSectionVisibility:(id:string,isVisible:boolean)=>adminRequest<CMSSection>(`/api/admin/sections/${encodeURIComponent(id)}/visibility`,{method:"PATCH",body:JSON.stringify({isVisible})}),
  deleteSection:(id:string)=>adminRequest<undefined>(`/api/admin/sections/${encodeURIComponent(id)}`,{method:"DELETE"})
};
export interface AdminWorkspaceSettings {
  id:string; key:string; displayName:string; email:string; timezone:string; theme:"light"|"dark"|"system"; notificationsEnabled:boolean; maintenanceMode:boolean; createdAt:string; updatedAt:string;
}
export const adminWorkspaceApi={
  get:()=>request<AdminWorkspaceSettings>("/api/admin/workspace",undefined,""),
  update:(payload:Partial<AdminWorkspaceSettings>)=>request<AdminWorkspaceSettings>("/api/admin/workspace",{method:"PATCH",body:JSON.stringify(payload)},"")
};