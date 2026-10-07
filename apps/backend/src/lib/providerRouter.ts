import { prisma } from "./prisma.js";

export type AIPurpose = "knowledge" | "agent" | "production";
export type AIOperation = "generate" | "embed";

type Protocol = "openai-responses" | "openai-chat" | "gemini";
type ProviderDefinition = {
  id: string;
  name: string;
  protocol: Protocol;
  keyEnv: string;
  baseUrl: string;
  models: Partial<Record<AIPurpose, string>> & { embed?: string };
  capabilities: string[];
  freeTier?: boolean;
};

type ProviderHealth = {
  failures: number;
  cooldownUntil: number;
  lastError?: string;
  lastStatusCode?: number;
};

const health = new Map<string, ProviderHealth>();
const COOLDOWN_MS = 30_000;

const providers: ProviderDefinition[] = [
  {
    id: "openai", name: "OpenAI", protocol: "openai-responses", keyEnv: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    models: {
      knowledge: process.env.OPENAI_KNOWLEDGE_MODEL ?? "gpt-6-luna",
      agent: process.env.OPENAI_AGENT_MODEL ?? "gpt-6-luna",
      production: process.env.OPENAI_PRODUCTION_MODEL ?? "gpt-6-luna",
      embed: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small"
    },
    capabilities: ["chat", "agent", "content", "embedding", "rag"], freeTier: false
  },
  {
    id: "groq", name: "Groq", protocol: "openai-chat", keyEnv: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    models: {
      knowledge: process.env.GROQ_KNOWLEDGE_MODEL ?? "openai/gpt-oss-120b",
      agent: process.env.GROQ_AGENT_MODEL ?? "openai/gpt-oss-120b",
      production: process.env.GROQ_PRODUCTION_MODEL ?? "openai/gpt-oss-120b"
    },
    capabilities: ["chat", "agent", "content"], freeTier: true
  },
  {
    id: "mistral", name: "Mistral", protocol: "openai-chat", keyEnv: "MISTRAL_API_KEY",
    baseUrl: "https://api.mistral.ai/v1",
    models: {
      knowledge: process.env.MISTRAL_KNOWLEDGE_MODEL ?? "mistral-small-latest",
      agent: process.env.MISTRAL_AGENT_MODEL ?? "mistral-small-latest",
      production: process.env.MISTRAL_PRODUCTION_MODEL ?? "mistral-small-latest",
      embed: process.env.MISTRAL_EMBEDDING_MODEL ?? "mistral-embed"
    },
    capabilities: ["chat", "agent", "content", "embedding", "rag"], freeTier: false
  },
  {
    id: "gemini", name: "Google Gemini", protocol: "gemini", keyEnv: "GEMINI_API_KEY",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: {
      knowledge: process.env.GEMINI_KNOWLEDGE_MODEL ?? "gemini-3.8-flash",
      agent: process.env.GEMINI_AGENT_MODEL ?? "gemini-3.8-flash",
      production: process.env.GEMINI_PRODUCTION_MODEL ?? "gemini-3.8-flash",
      embed: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-2"
    },
    capabilities: ["chat", "agent", "content", "embedding", "rag", "multimodal"], freeTier: true
  },
  ...loadOpenAICompatibleProviders()
];

function loadOpenAICompatibleProviders(): ProviderDefinition[] {
  const raw = process.env.AI_PROVIDER_REGISTRY_JSON;
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter((p: any) => p?.id && p?.keyEnv && p?.baseUrl).map((p: any) => ({
      id: String(p.id), name: String(p.name ?? p.id), protocol: "openai-chat" as const,
      keyEnv: String(p.keyEnv), baseUrl: String(p.baseUrl).replace(/\/$/, ""),
      models: { ...(p.models ?? {}) },
      capabilities: Array.isArray(p.capabilities) ? p.capabilities.map(String) : ["chat", "agent", "content"],
      freeTier: Boolean(p.freeTier)
    }));
  } catch (error) {
    console.error("[AI_PROVIDER_REGISTRY] invalid registry JSON", error);
    return [];
  }
}

const purposeEnvKeys: Record<AIPurpose, string> = {
  knowledge: "My-Project Knowledge", agent: "My-Project AI Agent", production: "My-Project Production AI"
};

function configuredKey(provider: ProviderDefinition, purpose: AIPurpose) {
  return provider.id === "openai"
    ? (process.env[purposeEnvKeys[purpose]] || process.env.OPENAI_API_KEY)
    : process.env[provider.keyEnv];
}

function order() {
  return [...new Set((process.env.AI_PROVIDER_ORDER ?? "openai,gemini,groq,mistral")
    .split(",").map((x) => x.trim()).filter(Boolean))];
}

function isCoolingDown(id: string) {
  return (health.get(id)?.cooldownUntil ?? 0) > Date.now();
}

function markFailure(id: string, error: unknown) {
  const statusCode = Number((error as any)?.statusCode) || undefined;
  const previous = health.get(id);
  const transient = !statusCode || statusCode === 408 || statusCode === 409 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
  health.set(id, {
    failures: (previous?.failures ?? 0) + 1,
    cooldownUntil: Date.now() + (transient ? COOLDOWN_MS : 5_000),
    lastError: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
    lastStatusCode: statusCode
  });
}

function markSuccess(id: string) {
  health.delete(id);
}

function candidates(operation: AIOperation, purpose: AIPurpose) {
  return order().map((id) => providers.find((p) => p.id === id))
    .filter((p): p is ProviderDefinition => Boolean(p))
    .filter((p) => Boolean(configuredKey(p, purpose)) && !isCoolingDown(p.id))
    .filter((p) => operation === "embed" ? p.capabilities.includes("embedding") : p.capabilities.includes("chat"));
}

async function logEvent(data: {
  provider: string; purpose: AIPurpose; operation: AIOperation; success: boolean;
  statusCode?: number; error?: string; latencyMs: number; fallbackFrom?: string | null; model?: string;
}) {
  try { await prisma.aIProviderEvent.create({ data }); }
  catch (error) { console.error("[AI_PROVIDER_LOG]", error); }
}

function providerError(message: string, statusCode?: number) {
  return Object.assign(new Error(message), { statusCode });
}

async function callOpenAIResponses(p: ProviderDefinition, messages: {role:string;content:string}[], purpose: AIPurpose) {
  const key = configuredKey(p, purpose)!; const model = p.models[purpose] ?? "gpt-6-luna";
  const response = await fetch(`${p.baseUrl}/responses`, {
    method: "POST", headers: {"Content-Type":"application/json", Authorization:`Bearer ${key}`},
    body: JSON.stringify({model, input: messages.map(m => ({role:m.role, content:[{type:"input_text", text:m.content}]}))})
  });
  const body = await response.text(); if (!response.ok) throw providerError(body, response.status);
  const data = JSON.parse(body); return {text: typeof data.output_text === "string" ? data.output_text : "", model};
}

async function callOpenAIChat(p: ProviderDefinition, messages: {role:string;content:string}[], purpose: AIPurpose) {
  const key = configuredKey(p, purpose)!; const model = p.models[purpose] ?? "";
  const response = await fetch(`${p.baseUrl}/chat/completions`, {
    method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${key}`},
    body:JSON.stringify({model, messages, temperature:0.2})
  });
  const body = await response.text(); if (!response.ok) throw providerError(body, response.status);
  const data = JSON.parse(body); return {text:data.choices?.[0]?.message?.content ?? "", model};
}

async function callGemini(p: ProviderDefinition, messages: {role:string;content:string}[], purpose: AIPurpose) {
  const key = configuredKey(p, purpose)!; const model = p.models[purpose]!;
  const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const contents = messages.filter(m => m.role !== "system").map(m => ({
    role:m.role === "assistant" ? "model" : "user", parts:[{text:m.content}]
  }));
  const response = await fetch(`${p.baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...system ? {systemInstruction:{parts:[{text:system}]}} : {}, contents})
  });
  const body = await response.text(); if (!response.ok) throw providerError(body, response.status);
  const data = JSON.parse(body);
  return {text:data.candidates?.[0]?.content?.parts?.map((x:any)=>x.text ?? "").join("") ?? "", model};
}

async function callEmbedding(p: ProviderDefinition, input: string, purpose: AIPurpose) {
  const key = configuredKey(p, purpose)!; const model = p.models.embed!;
  if (!model) throw new Error(`No embedding model configured for provider ${p.id}.`);
  if (p.protocol === "gemini") {
    const response = await fetch(`${p.baseUrl}/models/${encodeURIComponent(model)}:embedContent?key=${encodeURIComponent(key)}`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:`models/${model}`, content:{parts:[{text:input}]}})
    });
    const body = await response.text(); if (!response.ok) throw providerError(body, response.status);
    const data = JSON.parse(body); const vector = data.embedding?.values ?? data.embeddings?.[0]?.values;
    if (!Array.isArray(vector)) throw new Error("Gemini embedding response did not contain a vector.");
    return {vector, model};
  }
  const response = await fetch(`${p.baseUrl}/embeddings`, {
    method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${key}`},
    body:JSON.stringify({model, input})
  });
  const body = await response.text(); if (!response.ok) throw providerError(body, response.status);
  const data = JSON.parse(body); const vector = data.data?.[0]?.embedding;
  if (!Array.isArray(vector)) throw new Error("Embedding response did not contain a vector.");
  return {vector, model};
}

export async function generateAI(messages: {role:"system"|"user"|"assistant";content:string}[], purpose:AIPurpose="production") {
  let lastError: unknown; const list = candidates("generate", purpose);
  if (!list.length) throw new Error(`No configured AI provider is available for ${purpose} generation.`);
  for (let i=0;i<list.length;i++) {
    const p=list[i], started=Date.now(), fallbackFrom=i ? list[i-1].id : null;
    try {
      const result = p.protocol === "openai-responses" ? await callOpenAIResponses(p,messages,purpose)
        : p.protocol === "gemini" ? await callGemini(p,messages,purpose) : await callOpenAIChat(p,messages,purpose);
      markSuccess(p.id);
      await logEvent({provider:p.id,purpose,operation:"generate",success:true,latencyMs:Date.now()-started,fallbackFrom,model:result.model});
      if (fallbackFrom) console.warn(`[AI_FAILOVER] ${fallbackFrom} -> ${p.id} for ${purpose}`);
      return result.text;
    } catch (error) {
      lastError=error; markFailure(p.id,error);
      await logEvent({provider:p.id,purpose,operation:"generate",success:false,statusCode:(error as any)?.statusCode,error:error instanceof Error?error.message:String(error),latencyMs:Date.now()-started,fallbackFrom,model:p.models[purpose]});
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All AI providers failed.");
}

export async function embedText(input:string, purpose:AIPurpose="knowledge") {
  let lastError: unknown; const list=candidates("embed",purpose);
  if (!list.length) throw new Error(`No configured AI provider is available for ${purpose} embeddings.`);
  for (let i=0;i<list.length;i++) {
    const p=list[i], started=Date.now(), fallbackFrom=i ? list[i-1].id : null;
    try {
      const result=await callEmbedding(p,input,purpose); markSuccess(p.id);
      await logEvent({provider:p.id,purpose,operation:"embed",success:true,latencyMs:Date.now()-started,fallbackFrom,model:result.model});
      if (fallbackFrom) console.warn(`[AI_FAILOVER] ${fallbackFrom} -> ${p.id} for ${purpose} embedding`);
      return {vector:result.vector as number[],provider:p.id,model:result.model};
    } catch (error) {
      lastError=error; markFailure(p.id,error);
      await logEvent({provider:p.id,purpose,operation:"embed",success:false,statusCode:(error as any)?.statusCode,error:error instanceof Error?error.message:String(error),latencyMs:Date.now()-started,fallbackFrom,model:p.models.embed});
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All embedding providers failed.");
}

export function getProviderRegistry() {
  return providers.map(p => {
    const state=health.get(p.id);
    return {
      id:p.id,name:p.name,protocol:p.protocol,
      keyConfigured:order().includes(p.id) && Boolean(configuredKey(p,"production")),
      capabilities:p.capabilities,models:p.models,enabled:order().includes(p.id),freeTier:Boolean(p.freeTier),
      health:state && state.cooldownUntil>Date.now() ? "cooldown" : state?.failures ? "degraded" : "healthy",
      lastError:state?.lastError ?? null,cooldownUntil:state?.cooldownUntil ?? null
    };
  });
}

export async function getProviderEvents(limit=100) {
  return prisma.aIProviderEvent.findMany({orderBy:{createdAt:"desc"},take:Math.min(500,Math.max(1,limit))});
}
