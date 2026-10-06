import type { CMSSection } from "../../lib/api";

export function getText(content: CMSSection["content"], key: string, fallback: string): string {
  if (!content || Array.isArray(content)) return fallback;
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function getItems(content: CMSSection["content"], key: string, fallback: string[]): string[] {
  if (!content || Array.isArray(content)) return fallback;
  const value = content[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : fallback;
}
