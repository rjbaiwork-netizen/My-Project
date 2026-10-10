import type { CMSSection } from "../../lib/api";
import type { JsonObject } from "@my-project/shared";

function asObject(content: CMSSection["content"]): JsonObject | null {
  return content && typeof content === "object" && !Array.isArray(content) ? content as JsonObject : null;
}

export function getText(content: CMSSection["content"], key: string, fallback: string): string {
  const object = asObject(content);
  const value = object?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function getItems(content: CMSSection["content"], key: string, fallback: string[]): string[] {
  const object = asObject(content);
  const value = object?.[key];
  if (!Array.isArray(value)) return fallback;
  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
  return items.length > 0 ? items : fallback;
}
