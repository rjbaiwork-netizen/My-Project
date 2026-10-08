export type IntegrationMode="oauth"|"api-key-management"|"manual";
export type ProviderIntegrationSpec={
 id:string; name:string; mode:IntegrationMode; authUrl?:string; docsUrl?:string;
 secretKeys:string[]; capabilities:string[]; automatedKeyCreation:boolean;
};
export const PROVIDER_INTEGRATIONS:ProviderIntegrationSpec[]=[
 {id:"gemini",name:"Google Gemini",mode:"manual",docsUrl:"https://ai.google.dev/gemini-api/docs/api-key",secretKeys:["GEMINI_API_KEY"],capabilities:["chat","agent","content","embedding","rag","multimodal"],automatedKeyCreation:false},
 {id:"groq",name:"Groq",mode:"manual",docsUrl:"https://console.groq.com/keys",secretKeys:["GROQ_API_KEY"],capabilities:["chat","agent","content"],automatedKeyCreation:false},
 {id:"mistral",name:"Mistral",mode:"manual",docsUrl:"https://console.mistral.ai/api-keys",secretKeys:["MISTRAL_API_KEY"],capabilities:["chat","agent","content","embedding","rag"],automatedKeyCreation:false},
 {id:"openrouter",name:"OpenRouter",mode:"api-key-management",docsUrl:"https://openrouter.ai/docs/api/api-reference/api-keys/create-keys",secretKeys:["OPENROUTER_API_KEY"],capabilities:["chat","agent","content"],automatedKeyCreation:true},
 {id:"cloudflare",name:"Cloudflare Workers AI",mode:"manual",docsUrl:"https://developers.cloudflare.com/workers-ai/",secretKeys:["CLOUDFLARE_API_TOKEN"],capabilities:["chat","content","multimodal"],automatedKeyCreation:false},
 {id:"huggingface",name:"Hugging Face",mode:"manual",docsUrl:"https://huggingface.co/settings/tokens",secretKeys:["HF_TOKEN"],capabilities:["chat","content","embedding"],automatedKeyCreation:false},
 {id:"openai",name:"OpenAI",mode:"manual",docsUrl:"https://platform.openai.com/api-keys",secretKeys:["OPENAI_API_KEY"],capabilities:["chat","agent","content","embedding","rag"],automatedKeyCreation:false}
];
export function getIntegrationSpec(id:string){return PROVIDER_INTEGRATIONS.find(p=>p.id===id);}
