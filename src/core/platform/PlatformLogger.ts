type LogArgs = unknown[];

function debugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("sauron_debug_logs") === "true";
  } catch {
    return false;
  }
}

export const platformLogger = {
  error(message: string, ...args: LogArgs) {
    console.error(message, ...args);
  },
  warn(message: string, ...args: LogArgs) {
    console.warn(message, ...args);
  },
  info(message: string, ...args: LogArgs) {
    if (debugEnabled()) console.info(message, ...args);
  },
  debug(message: string, ...args: LogArgs) {
    if (debugEnabled()) console.debug(message, ...args);
  },
  trace(message: string, ...args: LogArgs) {
    if (debugEnabled()) console.trace(message, ...args);
  },
};
