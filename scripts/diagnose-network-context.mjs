#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promises as dns } from "node:dns";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const options = {
    host: "10.12.22.14",
    port: 3306,
    apiUrl: "http://127.0.0.1:3000/api/db/network-context",
    timeoutMs: 4000,
    runNc: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--run-nc") options.runNc = true;
    if (arg === "--host") options.host = argv[++index] || options.host;
    if (arg === "--port") options.port = Number(argv[++index] || options.port);
    if (arg === "--api-url") options.apiUrl = argv[++index] || options.apiUrl;
    if (arg === "--timeout-ms") options.timeoutMs = Number(argv[++index] || options.timeoutMs);
  }
  return options;
}

function effectiveUser() {
  const uid = typeof process.geteuid === "function" ? process.geteuid() : null;
  try {
    return { uid, username: os.userInfo().username };
  } catch {
    return { uid, username: process.env.USER || process.env.USERNAME || "unknown" };
  }
}

function interfaces() {
  return Object.entries(os.networkInterfaces()).flatMap(([name, entries]) =>
    (entries || []).map((entry) => ({
      name,
      address: entry.address,
      family: String(entry.family),
      netmask: entry.netmask,
      cidr: entry.cidr,
      internal: entry.internal,
    }))
  );
}

function namespaceId() {
  try {
    const value = fs.readlinkSync("/proc/self/ns/net");
    return value.match(/\[(\d+)\]/)?.[1] || null;
  } catch {
    return null;
  }
}

function proxyVariables() {
  return ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy"]
    .filter((name) => Boolean(process.env[name]));
}

function isolationSignals() {
  const signals = [];
  if (process.env.SNAP) signals.push("snap");
  if (process.env.FLATPAK_ID) signals.push("flatpak");
  if (process.env.CI) signals.push("ci");
  if (process.env.container) signals.push("container-env");
  return signals;
}

function routeFields(output) {
  return {
    interfaceName: output.match(/\bdev\s+(\S+)/)?.[1],
    gateway: output.match(/\bvia\s+(\S+)/)?.[1],
    localAddress: output.match(/\bsrc\s+(\S+)/)?.[1],
  };
}

async function routeProbe(host) {
  let resolved;
  try {
    resolved = await dns.lookup(host);
  } catch (error) {
    return { status: "failed", host, code: error.code || "DNS_ERROR", error: error.message };
  }

  const command = process.platform === "win32" ? "route" : "ip";
  const args = process.platform === "win32" ? ["print", resolved.address] : ["route", "get", resolved.address];
  try {
    const result = await execFileAsync(command, args, { timeout: 2500, maxBuffer: 16 * 1024 });
    const output = String(result.stdout || "").trim();
    return {
      status: output ? "passed" : "unavailable",
      host,
      resolvedAddress: resolved.address,
      family: resolved.family,
      command: [command, ...args].join(" "),
      ...routeFields(output),
      error: output ? undefined : "route command returned no data",
    };
  } catch (error) {
    return {
      status: error.code === "ENOENT" ? "unavailable" : "failed",
      host,
      resolvedAddress: resolved.address,
      family: resolved.family,
      command: [command, ...args].join(" "),
      code: error.code || "ROUTE_ERROR",
      error: error.message,
    };
  }
}

function tcpProbe(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = new net.Socket();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ...result, elapsedMs: Date.now() - startedAt });
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      const local = socket.address();
      const localInfo = local && typeof local === "object" ? local : null;
      finish({
        status: "passed",
        connected: true,
        localAddress: localInfo?.address,
        localPort: localInfo?.port,
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort,
      });
    });
    socket.once("timeout", () => finish({ status: "failed", connected: false, code: "ETIMEDOUT", error: "TCP timeout" }));
    socket.once("error", (error) => finish({ status: "failed", connected: false, code: error.code || "SOCKET_ERROR", error: error.message }));
    socket.connect(port, host);
  });
}

async function runNc(host, port, timeoutMs) {
  try {
    const result = await execFileAsync("nc", ["-vz", "-w", String(Math.ceil(timeoutMs / 1000)), host, String(port)], { timeout: timeoutMs + 1000, maxBuffer: 8 * 1024 });
    return { status: "passed", exitCode: 0, output: String(result.stderr || result.stdout || "").trim() };
  } catch (error) {
    return {
      status: "failed",
      exitCode: typeof error.code === "number" ? error.code : null,
      code: typeof error.code === "string" ? error.code : "NC_FAILED",
      output: String(error.stderr || error.stdout || error.message || "").trim(),
    };
  }
}

async function apiProbe(apiUrl, host, port) {
  const url = new URL(apiUrl);
  url.searchParams.set("host", host);
  url.searchParams.set("port", String(port));
  url.searchParams.set("type", "mysql");
  try {
    const response = await fetch(url, { cache: "no-store" });
    const body = await response.json();
    return { httpStatus: response.status, ...body };
  } catch (error) {
    return { httpStatus: null, success: false, error: error.message };
  }
}

function compare(local, api) {
  const differences = [];
  if (!api?.runtime) differences.push("API sem runtime disponível");
  if (api?.runtime?.effectiveUser?.username && api.runtime.effectiveUser.username !== local.effectiveUser.username) differences.push("usuário efetivo diferente");
  if (api?.runtime?.networkNamespaceId && local.networkNamespaceId && api.runtime.networkNamespaceId !== local.networkNamespaceId) differences.push("namespace de rede diferente");
  if (api?.runtime?.processExecutable && api.runtime.processExecutable !== local.processExecutable) differences.push("executável Node diferente");
  if (api?.runtime?.containerized !== undefined && api.runtime.containerized !== (local.isolationSignals.includes("container-env"))) differences.push("sinal de container divergente");
  if (api?.tcpProbe?.connected !== local.tcpProbe.connected) differences.push("resultado TCP divergente");
  return { divergent: differences.length > 0, differences };
}

const options = parseArgs(process.argv.slice(2));
const startedAt = Date.now();
const local = {
  process: "node",
  pid: process.pid,
  startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
  processExecutable: process.execPath,
  effectiveUser: effectiveUser(),
  hostname: os.hostname(),
  networkNamespaceId: namespaceId(),
  interfaces: interfaces(),
  proxyEnvironmentVariables: proxyVariables(),
  isolationSignals: isolationSignals(),
  target: { host: options.host, port: options.port },
  routeProbe: await routeProbe(options.host),
};
local.tcpProbe = await tcpProbe(options.host, options.port, options.timeoutMs);
local.elapsedMs = Date.now() - startedAt;

const report = {
  generatedAt: new Date().toISOString(),
  command: `node scripts/diagnose-network-context.mjs --host ${options.host} --port ${options.port}`,
  localNodeProbe: local,
  terminalNcProbe: options.runNc ? await runNc(options.host, options.port, options.timeoutMs) : { status: "not-run", instruction: "Use --run-nc no mesmo terminal onde nc funciona." },
  apiProbe: await apiProbe(options.apiUrl, options.host, options.port),
};
report.comparison = compare(report.localNodeProbe, report.apiProbe);

console.log(JSON.stringify(report, null, 2));
