/** Canonical browser events for cross-module state changes. */
export const PLATFORM_EVENTS = {
  SOURCE_IMPORTED: "SOURCE_IMPORTED",
  SOURCE_CONFIGURED: "SOURCE_CONFIGURED",
  ACTIVE_DATASET_CHANGED: "ACTIVE_DATASET_CHANGED",
  ENTERPRISE_CONTEXT_CHANGED: "ENTERPRISE_CONTEXT_CHANGED",
  DOMAIN_CONTEXT_CHANGED: "DOMAIN_CONTEXT_CHANGED",
  PRESENTATION_UPDATED: "PRESENTATION_UPDATED",
  AUTH_STATE_CHANGED: "AUTH_STATE_CHANGED",
  WORKSPACE_REGISTRY_CHANGED: "WORKSPACE_REGISTRY_CHANGED",
  DATA_SOURCE_STATE_CHANGED: "DATA_SOURCE_STATE_CHANGED",
} as const;

export type PlatformEventName = typeof PLATFORM_EVENTS[keyof typeof PLATFORM_EVENTS];

export function dispatchPlatformEvent<T>(name: PlatformEventName, detail: T): void {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function subscribePlatformEvent<T>(
  name: PlatformEventName,
  listener: (detail: T) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => listener((event as CustomEvent<T>).detail);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}
