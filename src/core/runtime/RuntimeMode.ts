/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RuntimeMode {
  LOCAL = "local",
  CLOUD = "cloud"
}

/**
 * Resolves the current runtime mode safely on both browser (Vite define) and Node.js environments.
 */
export function getRuntimeMode(): RuntimeMode {
  // Check if process.env.SAURON_RUNTIME_MODE is injected by build tools or available in Node.js
  const envMode = typeof process !== "undefined" && process.env
    ? process.env.SAURON_RUNTIME_MODE
    : null;

  if (envMode === "cloud") {
    return RuntimeMode.CLOUD;
  }
  return RuntimeMode.LOCAL;
}

export function isLocalMode(): boolean {
  return getRuntimeMode() === RuntimeMode.LOCAL;
}

export function isCloudMode(): boolean {
  return getRuntimeMode() === RuntimeMode.CLOUD;
}
