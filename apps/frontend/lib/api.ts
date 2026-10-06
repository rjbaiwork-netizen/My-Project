export type SectionKey =
  | "HEADER"
  | "HERO"
  | "ABOUT"
  | "SERVICES"
  | "PORTFOLIO"
  | "PRICING"
  | "TESTIMONIALS"
  | "BLOG"
  | "CONTACT"
  | "FOOTER";

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
  error?: {
    message: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !body?.success) {
    throw new Error(body?.error?.message ?? `Request failed with status ${response.status}.`);
  }

  return body.data;
}

export const sectionApi = {
  getAdminSections(): Promise<CMSSection[]> {
    return request<CMSSection[]>("/api/admin/sections");
  },

  updateSection(
    id: string,
    payload: { title?: string; content?: Record<string, unknown> | unknown[] }
  ): Promise<CMSSection> {
    return request<CMSSection>(`/api/admin/sections/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  setSectionVisibility(id: string, isVisible: boolean): Promise<CMSSection> {
    return request<CMSSection>(
      `/api/admin/sections/${encodeURIComponent(id)}/visibility`,
      {
        method: "PATCH",
        body: JSON.stringify({ isVisible })
      }
    );
  }
};
