export type CompatibilityDisposition =
  | "KEEP_TEMPORARILY"
  | "MIGRATE"
  | "DEPRECATE"
  | "REMOVE"
  | "TEST_ONLY";

export interface CompatibilityBoundary {
  symbol: string;
  module: string;
  disposition: CompatibilityDisposition;
  canonicalContract: string;
  reason: string;
  risks: string[];
  removalCondition: string;
}

export const LEGACY_COMPATIBILITY_BOUNDARIES: CompatibilityBoundary[] = [];
