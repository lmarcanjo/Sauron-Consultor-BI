/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PageCapabilityModel — F20.3 Block 3
 *
 * Gates must ask "what can this page do?", never "what is this page called?".
 * This module exposes the capability contract for a route without callers
 * needing to know whether the route is STATIC or a Business Area defined
 * by the active Project DNA. All capability data is sourced from NavigationRegistry —
 * this file intentionally holds no data of its own.
 */

import { navigationRegistry } from "./NavigationRegistry";

export interface PageCapability {
  routeKey: string;
  /** Registered at all. False for unknown/typo'd routes. */
  isRegistered: boolean;
  /** Can render a meaningful UI even without an active dataset. */
  canRenderWithoutDataset: boolean;
  /** Blocked by the empty-state gate when no dataset exists. */
  requiresActiveDataset: boolean;
  /** Blocked by the homologation gate until the dataset is approved. */
  requiresCertifiedSnapshot: boolean;
  /** Requires at least one confirmed field mapping before rendering data. */
  requiresConfiguredFields: boolean;
  /** True for Business Areas created from the active Project DNA (vs. built-in platform pages). */
  isBusinessArea: boolean;
}

const UNKNOWN_ROUTE_CAPABILITY: PageCapability = {
  routeKey: "",
  isRegistered: false,
  canRenderWithoutDataset: false,
  requiresActiveDataset: false,
  requiresCertifiedSnapshot: false,
  requiresConfiguredFields: false,
  isBusinessArea: false,
};

/**
 * Get the capability contract for a route key. Never throws — unknown
 * routes resolve to a safe, fully-restricted capability object so gates
 * fail closed instead of guessing based on the tab name.
 */
export function getPageCapability(routeKey: string): PageCapability {
  const item = navigationRegistry.resolve(routeKey);
  if (!item) {
    return { ...UNKNOWN_ROUTE_CAPABILITY, routeKey };
  }
  return {
    routeKey,
    isRegistered: true,
    canRenderWithoutDataset: item.canRenderWithoutDataset,
    requiresActiveDataset: item.requiresDataset,
    requiresCertifiedSnapshot: item.requiresApproval,
    requiresConfiguredFields: item.requiresConfiguredFields,
    isBusinessArea: item.type === "BUSINESS_AREA",
  };
}

/** True when the route is a Business Area defined by the active Project DNA. */
export function isBusinessAreaRoute(routeKey: string): boolean {
  return navigationRegistry.resolve(routeKey)?.type === "BUSINESS_AREA";
}

/** Extract the business area id from a `custom_area_*` route key, if any. */
export function extractBusinessAreaId(routeKey: string): string | null {
  const item = navigationRegistry.resolve(routeKey);
  if (!item || item.type !== "BUSINESS_AREA") return null;
  return routeKey.replace(/^custom_area_/, "");
}
