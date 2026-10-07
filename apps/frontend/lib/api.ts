export type SectionKey =
  | "HEADER" | "HERO" | "ABOUT" | "SERVICES" | "PORTFOLIO"
  | "PRICING" | "TESTIMONIALS" | "BLOG" | "CONTACT" | "FOOTER";

export interface CMSSection {
  id: string;
  key: SectionKey;
  title: string;
  content: Record<string, unknown> | unknown[];
  isVisible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { message: string };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type RequestOptions = RequestInit & {
  adminToken?: string;
};

function getServerAdminToken(explicitToken?: string): string | undefined {
  if (explicitToken) return explicitToken;
  if (typeof window !== "undefined") return undefined;
  return process.env.ADMIN_API_TOKEN;
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const { adminToken, headers: requestHeaders, ...requestInit } = init ?? {};
  const headers = new Headers(requestHeaders);
  headers.set("Content-Type", "application/json");

  const token = getServerAdminToken(adminToken);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers,
    cache: "no-store"
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !body?.success) {
    throw new Error(body?.error?.message ?? `Request failed with status ${response.status}.`);
  }
  return body.data;
}

export const sectionApi = {
  getPublicSections(): Promise<CMSSection[]> {
    return request<CMSSection[]>("/api/sections");
  },
  getAdminSections(adminToken?: string): Promise<CMSSection[]> {
    return request<CMSSection[]>("/api/admin/sections", { adminToken });
  },
  updateSection(id: string, payload: { title?: string; content?: Record<string, unknown> | unknown[] }, adminToken?: string): Promise<CMSSection> {
    return request<CMSSection>(`/api/admin/sections/${encodeURIComponent(id)}`, {
      method: "PATCH", body: JSON.stringify(payload), adminToken
    });
  },
  setSectionVisibility(id: string, isVisible: boolean, adminToken?: string): Promise<CMSSection> {
    return request<CMSSection>(`/api/admin/sections/${encodeURIComponent(id)}/visibility`, {
      method: "PATCH", body: JSON.stringify({ isVisible }), adminToken
    });
  }
};
