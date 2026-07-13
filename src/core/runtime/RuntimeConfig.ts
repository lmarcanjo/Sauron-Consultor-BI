/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RuntimeConfig {
  apiBaseUrl: string;
  timeoutMs: number;
}

/**
 * Returns configuration variables safely from environmental variables with fallback defaults.
 */
export function getRuntimeConfig(): RuntimeConfig {
  const env = typeof process !== "undefined" && process.env ? process.env : {};

  return {
    apiBaseUrl: env.API_BASE_URL || "http://localhost:3001",
    timeoutMs: Number(env.API_TIMEOUT_MS) || 15000
  };
}
