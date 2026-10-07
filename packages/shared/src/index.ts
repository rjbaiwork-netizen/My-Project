export const CMS_SECTION_KEYS = ["HEADER","HERO","ABOUT","SERVICES","PORTFOLIO","PRICING","TESTIMONIALS","BLOG","CONTACT","FOOTER"] as const;
export type SectionKey = (typeof CMS_SECTION_KEYS)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface CMSSection {
  id: string;
  key: SectionKey;
  title: string;
  content: JsonValue;
  isVisible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export type GetSectionsResponse = ApiResponse<CMSSection[]>;
export type GetSectionResponse = ApiResponse<CMSSection>;

export interface UpdateSectionRequest {
  title?: string;
  content?: JsonValue;
}

export interface SetSectionVisibilityRequest {
  isVisible: boolean;
}

export interface AdminSectionRoutes {
  list: "/api/admin/sections";
  update: "/api/admin/sections/:id";
  visibility: "/api/admin/sections/:id/visibility";
  delete: "/api/admin/sections/:id";
}
