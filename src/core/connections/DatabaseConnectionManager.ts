/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../../types";
import { securityEngine } from "../security/SecurityEngine";
import { normalizeDatabaseConfig } from "./DatabaseConfig";
import { platformLogger } from "../platform/PlatformLogger";
import * as fs from "node:fs";
import * as net from "node:net";
import * as os from "node:os";
import { promises as dns } from "node:dns";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type DatabaseType =
  | "postgres"
  | "mysql"
  | "mssql"
  | "oracle"
  | "mongodb";

export type ConnectionStage =
  | "vpn"
  | "configuration"
  | "route"
  | "host"
  | "port"
  | "handshake"
  | "auth"
  | "database"
  | "schema"
  | "permission"
  | "ssl"
  | "query"
  | "readonly"
  | "unknown";

export type ConnectionStageStatus = "passed" | "failed" | "skipped";

export interface ConnectionStageResult {
  stage: ConnectionStage;
  status: ConnectionStageStatus;
  message: string;
}

export interface ConnectionStageTiming {
  stage: ConnectionStage;
  elapsedMs: number;
}

export interface ConnectionErrorDetails {
  message: string;
  code?: string;
  stack?: string;
}

export interface DatabaseServerInfo {
  version?: string;
  currentUser?: string;
  database?: string | null;
}

export interface ConnectionRuntimeContext {
  process: "node";
  pid: number;
  startedAt: string;
  hostname: string;
  containerized: boolean;
  containerEvidence: string[];
  effectiveUser: { uid: number | null; username: string };
  processExecutable: string;
  networkNamespaceId: string | null;
  interfaces: NetworkInterfaceSnapshot[];
  proxyEnvironmentVariables: string[];
  isolationSignals: string[];
}

export interface NetworkInterfaceSnapshot {
  name: string;
  address: string;
  family: string;
  netmask?: string;
  cidr?: string | null;
  internal: boolean;
}

export interface NetworkRouteProbe {
  status: "passed" | "failed" | "unavailable";
  host: string;
  resolvedAddress?: string;
  family?: number;
  interfaceName?: string;
  gateway?: string;
  localAddress?: string;
  command?: string;
  code?: string;
  error?: string;
}

export interface NetworkTcpProbe {
  status: "passed" | "failed" | "skipped";
  host: string;
  port: number;
  connected: boolean;
  localAddress?: string;
  localPort?: number;
  remoteAddress?: string;
  remotePort?: number;
  elapsedMs: number;
  code?: string;
  error?: string;
}

export interface NetworkContextDiagnostics {
  runtime: ConnectionRuntimeContext;
  target: { host: string; port: number; type: DatabaseType };
  routeProbe: NetworkRouteProbe;
  tcpProbe: NetworkTcpProbe;
  elapsedMs: number;
}

export interface NetworkContextComparison {
  divergent: boolean;
  sameUser: boolean | null;
  sameNamespace: boolean | null;
  sameExecutable: boolean | null;
  differences: string[];
}

export function compareNetworkContexts(left: ConnectionRuntimeContext, right: ConnectionRuntimeContext): NetworkContextComparison {
  const differences: string[] = [];
  const sameUser = left.effectiveUser.username && right.effectiveUser.username
    ? left.effectiveUser.username === right.effectiveUser.username && (left.effectiveUser.uid === null || right.effectiveUser.uid === null || left.effectiveUser.uid === right.effectiveUser.uid)
    : null;
  const sameNamespace = left.networkNamespaceId && right.networkNamespaceId
    ? left.networkNamespaceId === right.networkNamespaceId
    : null;
  const sameExecutable = left.processExecutable && right.processExecutable
    ? left.processExecutable === right.processExecutable
    : null;

  if (sameUser === false) differences.push("usuário efetivo diferente");
  if (sameNamespace === false) differences.push("namespace de rede diferente");
  if (sameExecutable === false) differences.push("executável Node diferente");
  if (left.containerized !== right.containerized) differences.push("sinal de containerização diferente");

  return {
    divergent: differences.length > 0,
    sameUser,
    sameNamespace,
    sameExecutable,
    differences,
  };
}

export interface DatabaseConnectionDiagnostics {
  correlationId: string;
  runtime: ConnectionRuntimeContext;
  target: { host: string; port: number; type: DatabaseType };
  stages: ConnectionStageResult[];
  stageTimings: ConnectionStageTiming[];
  error?: ConnectionErrorDetails;
  serverInfo?: DatabaseServerInfo;
}

export interface TcpProbeResult {
  connected: boolean;
  elapsedMs: number;
  localAddress?: string;
  localPort?: number;
  remoteAddress?: string;
  remotePort?: number;
  code?: string;
  error?: string;
}

export type TcpProbe = (host: string, port: number, timeoutMs: number) => Promise<TcpProbeResult>;

export type RouteProbe = (host: string) => Promise<NetworkRouteProbe>;

export interface DatabaseConnectionDependencies {
  tcpProbe?: TcpProbe;
  dnsLookup?: (host: string) => Promise<void>;
  routeProbe?: RouteProbe;
}

export const defaultTcpProbe: TcpProbe = (host, port, timeoutMs) => new Promise((resolve) => {
  const startedAt = Date.now();
  const socket = new net.Socket();
  let settled = false;
  const finish = (result: Omit<TcpProbeResult, "elapsedMs">) => {
    if (settled) return;
    settled = true;
    socket.destroy();
    resolve({ ...result, elapsedMs: Date.now() - startedAt });
  };

  socket.setTimeout(timeoutMs);
  socket.once("connect", () => {
    const local = socket.address();
    const localInfo = typeof local === "object" && local !== null && "address" in local
      ? local as net.AddressInfo
      : null;
    finish({
      connected: true,
      localAddress: localInfo?.address,
      localPort: localInfo?.port,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
    });
  });
  socket.once("timeout", () => finish({ connected: false, error: "TCP timeout" }));
  socket.once("error", (error: NodeJS.ErrnoException) => finish({
    connected: false,
    code: error.code,
    error: error.message,
  }));
  socket.connect(port, host);
});

function detectContainer(): string[] {
  const evidence: string[] = [];
  if (fs.existsSync("/.dockerenv")) evidence.push("/.dockerenv");
  try {
    const cgroup = fs.readFileSync("/proc/1/cgroup", "utf8");
    if (/docker|containerd|kubepods/i.test(cgroup)) evidence.push("/proc/1/cgroup");
  } catch {
    // /proc is not available in every host runtime.
  }
  return evidence;
}

function getNetworkNamespaceId(): string | null {
  try {
    const namespace = fs.readlinkSync("/proc/self/ns/net");
    return namespace.match(/\[(\d+)\]/)?.[1] || null;
  } catch {
    return null;
  }
}

function getNetworkInterfaces(): NetworkInterfaceSnapshot[] {
  try {
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
  } catch {
    return [];
  }
}

function getEffectiveUser(): { uid: number | null; username: string } {
  const uid = typeof process.geteuid === "function" ? process.geteuid() : null;
  try {
    return { uid, username: os.userInfo().username };
  } catch {
    return { uid, username: process.env.USER || process.env.USERNAME || "unknown" };
  }
}

function getProxyEnvironmentVariables(): string[] {
  return ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy"]
    .filter((name) => Boolean(process.env[name]));
}

function getIsolationSignals(containerEvidence: string[]): string[] {
  const signals = [...containerEvidence];
  if (process.env.SNAP) signals.push("snap");
  if (process.env.FLATPAK_ID) signals.push("flatpak");
  if (process.env.CI) signals.push("ci");
  return signals;
}

function parseRouteOutput(output: string): Pick<NetworkRouteProbe, "interfaceName" | "gateway" | "localAddress"> {
  return {
    interfaceName: output.match(/\bdev\s+(\S+)/)?.[1],
    gateway: output.match(/\bvia\s+(\S+)/)?.[1],
    localAddress: output.match(/\bsrc\s+(\S+)/)?.[1],
  };
}

export const defaultRouteProbe: RouteProbe = async (host) => {
  let resolvedAddress: string;
  let family: number;
  try {
    const resolved = await dns.lookup(host);
    resolvedAddress = resolved.address;
    family = resolved.family;
  } catch (error: any) {
    return {
      status: "failed",
      host,
      error: error?.message || "Falha na resolução do host.",
      code: error?.code || "DNS_ERROR",
    };
  }

  const command = process.platform === "win32" ? "route" : "ip";
  const args = process.platform === "win32"
    ? ["print", resolvedAddress]
    : ["route", "get", resolvedAddress];
  try {
    const result = await execFileAsync(command, args, { timeout: 2500, maxBuffer: 16 * 1024 });
    const output = String(result.stdout || "").trim();
    return {
      status: output ? "passed" : "unavailable",
      host,
      resolvedAddress,
      family,
      command: [command, ...args].join(" "),
      ...parseRouteOutput(output),
      error: output ? undefined : "Comando de rota não retornou dados.",
    };
  } catch (error: any) {
    const unavailable = error?.code === "ENOENT";
    return {
      status: unavailable ? "unavailable" : "failed",
      host,
      resolvedAddress,
      family,
      command: [command, ...args].join(" "),
      code: error?.code || "ROUTE_ERROR",
      error: error?.message || "Falha ao consultar a tabela de rotas.",
    };
  }
};

function configuredTarget(config: any): { host: string; port: number } {
  let host = config.host || "localhost";
  let port = Number(config.port);
  if (config.connectionString) {
    try {
      const parsed = new URL(config.connectionString);
      host = parsed.hostname || host;
      port = Number(parsed.port || (config.type === "mysql" ? 3306 : config.type === "postgres" ? 5432 : port));
    } catch {
      // Driver-specific connection strings are handled by the driver itself.
    }
  }
  return { host, port };
}

function createCorrelationId(): string {
  return `db-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

function sanitizeDiagnosticText(value: unknown, config: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  let text = String(value);
  for (const secret of [config?.password, config?.sshPassword, config?.sshPrivateKey, config?.connectionString]) {
    if (secret) text = text.split(String(secret)).join("[REDACTED]");
  }
  return text;
}

function toConnectionError(error: any, config: any): ConnectionErrorDetails {
  return {
    message: sanitizeDiagnosticText(error?.message || String(error), config) || "Erro desconhecido.",
    code: error?.code || error?.errno,
    stack: sanitizeDiagnosticText(error?.stack, config),
  };
}

function recordStageTiming(context: ConnectionTestContext, stage: ConnectionStage, startedAt: number): void {
  context.stageTimings.push({ stage, elapsedMs: Date.now() - startedAt });
}

interface ConnectionTestContext {
  correlationId: string;
  stageTimings: ConnectionStageTiming[];
}

export interface DatabaseConnectionResult {
  success: boolean;
  stage: ConnectionStage;
  message: string;
  correlationId?: string;
  technicalDetails?: string;
  tables?: string[];
  schemas?: string[];
  stageTimings?: ConnectionStageTiming[];
  error?: ConnectionErrorDetails;
  serverInfo?: DatabaseServerInfo;
  diagnostics?: DatabaseConnectionDiagnostics;
}

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;

  private constructor(private readonly dependencies: DatabaseConnectionDependencies = {}) {}

  public static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  public static createForTesting(dependencies: DatabaseConnectionDependencies): DatabaseConnectionManager {
    return new DatabaseConnectionManager(dependencies);
  }

  public getRuntimeContext(): ConnectionRuntimeContext {
    const containerEvidence = detectContainer();
    return {
      process: "node",
      pid: process.pid,
      startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      hostname: os.hostname(),
      containerized: containerEvidence.length > 0,
      containerEvidence,
      effectiveUser: getEffectiveUser(),
      processExecutable: process.execPath,
      networkNamespaceId: getNetworkNamespaceId(),
      interfaces: getNetworkInterfaces(),
      proxyEnvironmentVariables: getProxyEnvironmentVariables(),
      isolationSignals: getIsolationSignals(containerEvidence),
    };
  }

  public async diagnoseNetworkContext(
    host: string,
    port: number,
    type: DatabaseType = "mysql"
  ): Promise<NetworkContextDiagnostics> {
    const startedAt = Date.now();
    const routeProbe = await (this.dependencies.routeProbe || defaultRouteProbe)(host);
    let tcpProbe: NetworkTcpProbe;

    if (routeProbe.status === "failed" && !routeProbe.resolvedAddress) {
      tcpProbe = {
        status: "skipped",
        host,
        port,
        connected: false,
        elapsedMs: 0,
        error: "TCP não executado porque o host não foi resolvido.",
      };
    } else {
      const probe = await (this.dependencies.tcpProbe || defaultTcpProbe)(host, port, 4000);
      tcpProbe = {
        status: probe.connected ? "passed" : "failed",
        host,
        port,
        connected: probe.connected,
        localAddress: probe.localAddress,
        localPort: probe.localPort,
        remoteAddress: probe.remoteAddress,
        remotePort: probe.remotePort,
        elapsedMs: probe.elapsedMs,
        code: probe.code,
        error: probe.error,
      };
    }

    return {
      runtime: this.getRuntimeContext(),
      target: { host, port, type },
      routeProbe,
      tcpProbe,
      elapsedMs: Date.now() - startedAt,
    };
  }

  /**
   * Generates a helpful tip for Docker container network isolation.
   */
  public getDockerConnectionHint(host: string): string {
    if (host === "localhost" || host === "127.0.0.1") {
      return " Dentro do container Docker, 'localhost' aponta para o próprio container. Altere para 'host.docker.internal' se o banco de dados estiver rodando na máquina host ou use o nome do serviço docker-compose correspondente (ex: 'postgres', 'mysql', 'db', 'database').";
    }
    return "";
  }

  /**
   * Safe check for a SQL query, asserting that it is read-only.
   */
  public assertReadOnlyQuery(query: string): void {
    securityEngine.assertReadOnlyQuery(query);
  }

  /**
   * Logs a database event to the server audit trails.
   */
  public async logAudit(
    eventType: string,
    status: "Tentativa" | "Sucesso" | "Falha" | "Info" | "Blocked",
    description: string,
    user = "lmarcanjo16@gmail.com",
    metadata: any = {}
  ): Promise<void> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const SYSTEM_DB_FILE = path.join(process.cwd(), "system_db.json");

      let sysDb: any = {};
      if (fs.existsSync(SYSTEM_DB_FILE)) {
        sysDb = JSON.parse(fs.readFileSync(SYSTEM_DB_FILE, "utf-8"));
      }

      if (!sysDb.auditLogs) {
        sysDb.auditLogs = [];
      }

      const logEntry = {
        id: "log_" + crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        eventType,
        status,
        description,
        user,
        ...metadata
      };

      sysDb.auditLogs.unshift(logEntry);
      fs.writeFileSync(SYSTEM_DB_FILE, JSON.stringify(sysDb, null, 2), "utf-8");
      platformLogger.info(`[AUDIT LOG] ${eventType} - ${status} - ${description}`);
    } catch (e: any) {
      platformLogger.warn("Erro ao salvar log de auditoria no ConnectionManager:", e.message);
    }
  }

  /**
   * Helper to bridge database traffic through an SSH VM Connection
   */
  private async setupSshTunnel(config: any): Promise<{ localHost: string; localPort: number; close: () => Promise<void> }> {
    const { Client: SshClient } = await import("ssh2");
    const net = await import("net");

    return new Promise((resolve, reject) => {
      const { sshHost, sshPort, sshUser, sshPassword, sshPrivateKey, host, port } = config;

      const sshBtn = new SshClient();
      const server = net.createServer((socket) => {
        sshBtn.forwardOut(
          "127.0.0.1",
          socket.remotePort || 0,
          host || "127.0.0.1",
          Number(port || 5432),
          (err, stream) => {
            if (err) {
              platformLogger.warn("[SSH Tunnel Info] Encaminhamento de trafego finalizado:", String(err?.message || err));
              socket.destroy();
              return;
            }
            socket.pipe(stream).pipe(stream);
          }
        );
      });

      server.unref();

      sshBtn.on("ready", () => {
        server.listen(0, "127.0.0.1", () => {
          const address = server.address() as any;
          const localPort = address.port;

          resolve({
            localHost: "127.0.0.1",
            localPort,
            close: () => {
              return new Promise<void>((res) => {
                server.close(() => {
                  sshBtn.end();
                  res();
                });
              });
            }
          });
        });
      });

      sshBtn.on("error", (err) => {
        server.close();
        reject(new Error(`Erro de autenticação ou conexão na máquina virtual VM (SSH): ${err.message}`));
      });

      const connectConfig: any = {
        host: sshHost,
        port: Number(sshPort || 22),
        username: sshUser,
        readyTimeout: 10000
      };

      if (sshPrivateKey) {
        connectConfig.privateKey = sshPrivateKey;
      } else if (sshPassword) {
        connectConfig.password = sshPassword;
      }

      try {
        sshBtn.connect(connectConfig);
      } catch (e: any) {
        server.close();
        reject(new Error(`Erro ao inicializar o SSH Client: ${e.message}`));
      }
    });
  }

  /**
   * Test connection in detailed stages.
   */
  public async testConnection(config: any): Promise<DatabaseConnectionResult> {
    const context: ConnectionTestContext = { correlationId: createCorrelationId(), stageTimings: [] };
    const result = await this.runConnectionTest(config, context);
    const enrichedResult = {
      ...result,
      correlationId: result.correlationId || context.correlationId,
      stageTimings: result.stageTimings || context.stageTimings,
    };
    return {
      ...enrichedResult,
      diagnostics: this.buildDiagnostics(config, enrichedResult),
    };
  }

  private buildDiagnostics(config: any, result: DatabaseConnectionResult): DatabaseConnectionDiagnostics {
    const failedStage = result.success ? null : result.stage;
    const stages: ConnectionStageResult[] = [];
    const add = (stage: ConnectionStage, status: ConnectionStageStatus, message: string) => stages.push({ stage, status, message });

    const stopAtFailure = (stage: ConnectionStage, message: string) => {
      add(stage, "failed", message);
    };

    if (config.useSshTunnel) {
      if (failedStage === "vpn") {
        stopAtFailure("vpn", result.message);
        return this.diagnosticsFor(config, result, stages);
      }
      add("vpn", "passed", "Túnel SSH estabelecido pelo processo Node.");
    }

    if (failedStage === "configuration") {
      stopAtFailure("configuration", result.message);
      return this.diagnosticsFor(config, result, stages);
    }
    add("configuration", "passed", "Configuração MySQL mínima validada.");

    if (failedStage === "host") {
      stopAtFailure("host", result.message);
      return this.diagnosticsFor(config, result, stages);
    }
    if (failedStage === "port") {
      add("route", "failed", "O processo Node não conseguiu alcançar o destino pela rota atual.");
      add("host", "passed", "Host resolvido pelo processo Node.");
      stopAtFailure("port", result.message);
      return this.diagnosticsFor(config, result, stages);
    }
    add("route", "passed", "A rota do processo Node alcançou o destino TCP.");
    add("host", "passed", "Host resolvido pelo processo Node.");
    add("port", "passed", "Socket TCP aberto pelo processo Node.");

    const driverStages: ConnectionStage[] = ["handshake", "auth", "database", "schema", "query", "readonly"];
    const failedDriverIndex = failedStage ? driverStages.indexOf(failedStage) : -1;
    driverStages.forEach((stage, index) => {
      if (failedDriverIndex >= 0 && index > failedDriverIndex) return;
      if (failedStage === stage) {
        stopAtFailure(stage, result.message);
        return;
      }
      add(stage, "passed", stage === "handshake" ? "Handshake do mysql2 concluído." : "Etapa concluída.");
    });

    if (failedStage && failedDriverIndex < 0) {
      stopAtFailure("handshake", result.message);
    }

    return this.diagnosticsFor(config, result, stages);
  }

  private diagnosticsFor(config: any, result: DatabaseConnectionResult, stages: ConnectionStageResult[]): DatabaseConnectionDiagnostics {
    return {
      correlationId: result.correlationId || "unknown",
      runtime: this.getRuntimeContext(),
      target: {
        ...configuredTarget(config),
        type: config.type as DatabaseType,
      },
      stages,
      stageTimings: result.stageTimings || [],
      error: result.error,
      serverInfo: result.serverInfo,
    };
  }

  private async runConnectionTest(config: any, context: ConnectionTestContext): Promise<DatabaseConnectionResult> {
    const type = config.type as DatabaseType;
    const initialTarget = configuredTarget(config);
    let activeHost = initialTarget.host;
    let activePort = initialTarget.port;
    let sshTunnel: any = null;

    try {
      if (config.useSshTunnel) {
        try {
          sshTunnel = await this.setupSshTunnel({
            sshHost: config.sshHost,
            sshPort: config.sshPort,
            sshUser: config.sshUser,
            sshPassword: config.sshPassword,
            sshPrivateKey: config.sshPrivateKey,
            host: activeHost,
            port: activePort
          });
          activeHost = sshTunnel.localHost;
          activePort = sshTunnel.localPort;
        } catch (err: any) {
          return {
            success: false,
            stage: "vpn",
            message: `Falha ao abrir túnel SSH/VPN: ${err.message}`,
            technicalDetails: sanitizeDiagnosticText(err.message, config),
            error: toConnectionError(err, config),
          };
        }
      }

      const host = activeHost;
      const port = activePort;

      if (type === "mysql" && !config.connectionString) {
        const configurationStartedAt = Date.now();
        if (!String(config.database || "").trim()) {
          const result = {
            success: false,
            stage: "configuration" as const,
            message: "Database obrigatório.",
          };
          recordStageTiming(context, "configuration", configurationStartedAt);
          return result;
        }
        if (!String(config.password || "")) {
          const result = {
            success: false,
            stage: "configuration" as const,
            message: "Senha do MySQL obrigatória para testar a autenticação.",
          };
          recordStageTiming(context, "configuration", configurationStartedAt);
          return result;
        }
        recordStageTiming(context, "configuration", configurationStartedAt);
      }

    // 1. DNS STAGE
    const hostStartedAt = Date.now();
    try {
      const lookup = this.dependencies.dnsLookup || (async (value: string) => {
        await dns.lookup(value);
      });
      await lookup(host);
    } catch (err: any) {
      const hint = this.getDockerConnectionHint(host);
      const message = `Host '${host}' não pôde ser resolvido via DNS.${hint}`;
      await this.logAudit(
        "DB_CONNECTION_TEST_WARNING",
        "Info",
        `Host '${host}' não encontrado (DNS lookup failed).`,
        config.user || "lmarcanjo16@gmail.com",
        { type, host, database: config.database, stage: "host", error: err.message }
      );
      return {
        success: false,
        stage: "host",
        message,
        technicalDetails: sanitizeDiagnosticText(err.message, config),
        error: toConnectionError(err, config),
      };
    } finally {
      recordStageTiming(context, "host", hostStartedAt);
    }

    // 2. TCP PORT CONNECTIVITY STAGE
    const portStartedAt = Date.now();
    try {
      const probe = this.dependencies.tcpProbe || defaultTcpProbe;
      const probeResult = await probe(host, port, 4000);

      if (!probeResult.connected) {
        const hint = this.getDockerConnectionHint(host);
        const message = `O processo Node não conseguiu abrir o socket TCP para ${host}:${port}.${hint} Isso não prova que a porta esteja fechada em outro ambiente.`;
        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Socket TCP não aberto pelo processo Node em ${host}:${port}`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "port" }
        );
        return {
          success: false,
          stage: "port",
          message,
          technicalDetails: `TCP não abriu no processo Node (${probeResult.code || "sem código"}): ${probeResult.error || "timeout/refused"}. Verifique a rota deste ambiente, não apenas a porta no host.`,
          error: toConnectionError({ message: probeResult.error || "timeout/refused", code: probeResult.code }, config),
        };
      }
    } catch (err: any) {
      return {
        success: false,
        stage: "port",
        message: "Erro ao testar a porta TCP.",
        technicalDetails: sanitizeDiagnosticText(err.message, config),
        error: toConnectionError(err, config),
      };
    } finally {
      recordStageTiming(context, "port", portStartedAt);
    }

    // 3. DATABASE DRIVER AUTH / CONNECTION / QUERY STAGES
    if (type === "postgres") {
      try {
        const pg = await import("pg");
        const clientConfig: any = config.connectionString
          ? { connectionString: config.connectionString }
          : { host, port, user: config.user, password: config.password, database: config.database };

        if (config.ssl) {
          clientConfig.ssl = { rejectUnauthorized: false };
        }

        const client = new pg.default.Client(clientConfig);
        try {
          await client.connect();
        } catch (err: any) {
          await client.end().catch(() => {});
          const errMsg = err.message || "";
          const errCode = err.code || "";

          let stage: ConnectionStage = "unknown";
          let message = "Erro desconhecido na tentativa de conexão Postgres.";

          if (errCode === "28P01" || errMsg.includes("password authentication") || errMsg.includes("authentication failed")) {
            stage = "auth";
            message = "Falha de autenticação. Usuário ou senha incorretos para o banco de dados.";
          } else if (errCode === "3D000" || (errMsg.includes("database") && errMsg.includes("does not exist"))) {
            stage = "database";
            message = `Banco de dados '${config.database}' não existe no servidor postgres.`;
          } else if (errMsg.includes("SSL") || errMsg.includes("no pg_hba.conf entry") || errMsg.includes("negotiation failed")) {
            stage = "ssl";
            message = "Erro de handshake SSL/TLS ou permissão pg_hba.conf de criptografia requerida.";
          }

          await this.logAudit(
            "DB_CONNECTION_TEST_WARNING",
            "Info",
            `Falha na autenticação ou seleção do banco Postgres: ${message}`,
            config.user || "lmarcanjo16@gmail.com",
            { type, host, database: config.database, stage, error: errMsg }
          );

          return {
            success: false,
            stage,
            message,
            technicalDetails: `Postgres Code: ${errCode}. ${errMsg}`
          };
        }

        // Test Query (SELECT 1)
        try {
          await client.query("SELECT 1;");
        } catch (err: any) {
          await client.end().catch(() => {});
          await this.logAudit(
            "DB_CONNECTION_TEST_WARNING",
            "Info",
            `Erro de permissão ou consulta no Postgres: ${err.message}`,
            config.user || "lmarcanjo16@gmail.com",
            { type, host, database: config.database, stage: "query", error: err.message }
          );
          return {
            success: false,
            stage: "query",
            message: "Conectado com sucesso, mas falhou ao executar SELECT 1 (sem permissão de leitura).",
            technicalDetails: err.message
          };
        }

        // Test listing tables
        let tables: string[] = [];
        try {
          const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            LIMIT 50;
          `);
          tables = tablesResult.rows.map(r => r.table_name);
        } catch (err: any) {
          await client.end().catch(() => {});
          await this.logAudit(
            "DB_CONNECTION_TEST_WARNING",
            "Info",
            `Erro ao ler schema Postgres: ${err.message}`,
            config.user || "lmarcanjo16@gmail.com",
            { type, host, database: config.database, stage: "schema", error: err.message }
          );
          return {
            success: false,
            stage: "schema",
            message: "Schema não encontrado ou sem permissão para listar tabelas públicas.",
            technicalDetails: err.message
          };
        }

        await client.end().catch(() => {});

        await this.logAudit(
          "DB_CONNECTION_TEST_SUCCESS",
          "Sucesso",
          `Conectado com sucesso ao Postgres! Encontradas ${tables.length} tabelas no modo somente-leitura.`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "readonly" }
        );

        return {
          success: true,
          stage: "readonly",
          message: `Conectado com sucesso ao Postgres! Encontradas ${tables.length} tabelas públicas. Banco de dados configurado no modo somente-leitura.`,
          tables
        };

      } catch (err: any) {
        return {
          success: false,
          stage: "unknown",
          message: "Erro desconhecido na tentativa de conexão Postgres.",
          technicalDetails: err.message
        };
      }
    } else if (type === "mysql") {
      let connection: any = null;
      let transactionActive = false;
      let readonlyStartedAt: number | null = null;
      let connectionClosed = false;
      const closeConnection = async () => {
        if (!connection || connectionClosed) return;
        connectionClosed = true;
        try {
          await connection.end();
        } catch {
          // Cleanup must not replace the result of the certification pipeline.
        }
      };
      const rollback = async () => {
        if (!transactionActive || !connection) return;
        try {
          await connection.query("ROLLBACK");
        } finally {
          // The rollback was attempted. Do not issue a second command while closing.
          transactionActive = false;
        }
      };
      const finishReadonlyTiming = () => {
        if (readonlyStartedAt !== null) {
          recordStageTiming(context, "readonly", readonlyStartedAt);
          readonlyStartedAt = null;
        }
      };
      const auditFailure = async (stage: ConnectionStage, message: string, error: any, elapsedMs?: number) => {
        const details = toConnectionError(error, config);
        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Falha na conexão MySQL: ${message}`,
          config.user || "lmarcanjo16@gmail.com",
          {
            type,
            host,
            database: config.database,
            stage,
            correlationId: context.correlationId,
            elapsedMs,
            mysqlCode: details.code,
            originalError: details.message,
            stack: details.stack,
          }
        );
        return details;
      };

      try {
        const mysql = await import("mysql2/promise");
        const clientConfig: any = config.connectionString
          ? config.connectionString
          : { host, port, user: config.user, password: config.password, database: config.database };

        if (config.ssl && typeof clientConfig === "object") {
          clientConfig.ssl = { rejectUnauthorized: false };
        }

        const driverStartedAt = Date.now();
        try {
          connection = await mysql.default.createConnection(clientConfig);
        } catch (err: any) {
          const details = toConnectionError(err, config);
          const errMsg = details.message;
          const errCode = String(details.code || "");
          let stage: ConnectionStage = "handshake";
          let message = "Falha no handshake do driver MySQL.";

          if (errCode.includes("ACCESS_DENIED") || errMsg.includes("Access denied for user")) {
            stage = "auth";
            message = "Credenciais inválidas. Acesso negado para o usuário informado.";
          } else if (errMsg.includes("Unknown database") || errCode === "ER_BAD_DB_ERROR") {
            stage = "database";
            message = `Banco de dados '${config.database}' não foi encontrado.`;
          } else if (errMsg.includes("SSL") || errCode === "HANDSHAKE_FAILED" || errCode.includes("HANDSHAKE")) {
            stage = "handshake";
            message = "Falha no handshake MySQL/SSL.";
          }

          recordStageTiming(context, "handshake", driverStartedAt);
          if (stage !== "handshake") recordStageTiming(context, "auth", driverStartedAt);
          if (stage === "database") recordStageTiming(context, "database", driverStartedAt);
          await auditFailure(stage, message, err, Date.now() - driverStartedAt);
          return {
            success: false,
            stage,
            message,
            technicalDetails: `${errCode || "MYSQL_ERROR"}: ${errMsg}`,
            error: details,
          };
        }
        recordStageTiming(context, "handshake", driverStartedAt);
        recordStageTiming(context, "auth", driverStartedAt);

        const databaseStartedAt = Date.now();
        let serverInfo: DatabaseServerInfo = {};
        try {
          const [rows]: any = await connection.query("SELECT VERSION() AS version, CURRENT_USER() AS current_user_value, DATABASE() AS database_name");
          const row = rows?.[0] || {};
          const selectedDatabase = row.database_name ?? row["DATABASE()"] ?? null;
          serverInfo = {
            version: String(row.version ?? row["VERSION()"] ?? ""),
            currentUser: String(row.current_user_value ?? row["CURRENT_USER()"] ?? ""),
            database: selectedDatabase === null ? null : String(selectedDatabase),
          };
          if (!serverInfo.database || serverInfo.database !== String(config.database).trim()) {
            const error = new Error(`Database selecionado não corresponde ao solicitado: ${serverInfo.database || "vazio"}.`);
            (error as any).code = "ER_DATABASE_SELECTION";
            const details = await auditFailure("database", error.message, error, Date.now() - databaseStartedAt);
            return {
              success: false,
              stage: "database",
              message: `Database '${config.database}' não foi selecionado pelo MySQL.`,
              technicalDetails: details.message,
              error: details,
              serverInfo,
            };
          }
        } catch (err: any) {
          const details = await auditFailure("database", "Falha ao validar o database selecionado.", err, Date.now() - databaseStartedAt);
          return {
            success: false,
            stage: "database",
            message: "Falha ao validar o database selecionado.",
            technicalDetails: `${details.code || "MYSQL_ERROR"}: ${details.message}`,
            error: details,
          };
        } finally {
          recordStageTiming(context, "database", databaseStartedAt);
        }

        readonlyStartedAt = Date.now();
        try {
          await connection.query("START TRANSACTION READ ONLY");
          transactionActive = true;
        } catch (err: any) {
          finishReadonlyTiming();
          const details = await auditFailure("readonly", "Falha ao configurar transação somente leitura.", err);
          return {
            success: false,
            stage: "readonly",
            message: "Falha ao configurar a conexão como somente leitura.",
            technicalDetails: `${details.code || "MYSQL_ERROR"}: ${details.message}`,
            error: details,
            serverInfo,
          };
        }

        const schemaStartedAt = Date.now();
        let tables: string[] = [];
        try {
          const [rows]: any = await connection.query("SHOW TABLES");
          tables = (rows || []).map((row: any) => Object.values(row)[0]).filter(Boolean).map(String);
        } catch (err: any) {
          finishReadonlyTiming();
          const details = await auditFailure("schema", "Erro ao ler o schema MySQL.", err, Date.now() - schemaStartedAt);
          return {
            success: false,
            stage: "schema",
            message: "Schema inexistente ou sem permissão para listar tabelas.",
            technicalDetails: `${details.code || "MYSQL_ERROR"}: ${details.message}`,
            error: details,
            serverInfo,
          };
        } finally {
          recordStageTiming(context, "schema", schemaStartedAt);
        }

        const queryStartedAt = Date.now();
        try {
          await connection.query("SELECT 1");
        } catch (err: any) {
          finishReadonlyTiming();
          const details = await auditFailure("query", "Falha ao executar SELECT 1.", err, Date.now() - queryStartedAt);
          return {
            success: false,
            stage: "query",
            message: "A conexão foi autenticada, mas SELECT 1 falhou.",
            technicalDetails: `${details.code || "MYSQL_ERROR"}: ${details.message}`,
            error: details,
            serverInfo,
          };
        } finally {
          recordStageTiming(context, "query", queryStartedAt);
        }

        try {
          await rollback();
          finishReadonlyTiming();
        } catch (err: any) {
          const details = await auditFailure("readonly", "Falha ao encerrar a transação somente leitura.", err);
          return {
            success: false,
            stage: "readonly",
            message: "A transação somente leitura não pôde ser encerrada com segurança.",
            technicalDetails: `${details.code || "MYSQL_ERROR"}: ${details.message}`,
            error: details,
            serverInfo,
          };
        }

        await this.logAudit(
          "DB_CONNECTION_TEST_SUCCESS",
          "Sucesso",
          "Conexão MySQL validada; consultas de certificação executadas em transação somente leitura.",
          config.user || "lmarcanjo16@gmail.com",
          {
            type,
            host,
            database: config.database,
            stage: "readonly",
            correlationId: context.correlationId,
            stageTimings: context.stageTimings,
          }
        );

        return {
          success: true,
          stage: "readonly",
          message: "Conexão MySQL validada; consultas de certificação executadas em transação somente leitura.",
          tables,
          serverInfo,
        };
      } catch (err: any) {
        finishReadonlyTiming();
        const details = await auditFailure("handshake", "Erro interno no fluxo do driver MySQL.", err);
        return {
          success: false,
          stage: "handshake",
          message: "Erro interno no fluxo do driver MySQL.",
          technicalDetails: `${details.code || "MYSQL_ERROR"}: ${details.message}`,
          error: details,
        };
      } finally {
        try {
          await rollback();
        } catch {
          // Preserve the original pipeline result; the rollback attempt is recorded by its caller.
        }
        await closeConnection();
      }
    } else if (type === "mssql") {
      try {
        const mssql = await import("mssql");
        const clientConfig: any = config.connectionString
          ? config.connectionString
          : {
              server: host,
              port,
              user: config.user,
              password: config.password,
              database: config.database,
              options: {
                encrypt: config.ssl,
                trustServerCertificate: true
              }
            };
        const pool = await mssql.default.connect(clientConfig);
        await pool.request().query("SELECT 1;");
        const tablesResult = await pool.request().query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_type = 'BASE TABLE'
          ORDER BY table_name;
        `);
        const tables = tablesResult.recordset.map(row => row.table_name || row.TABLE_NAME || "");
        await pool.close().catch(() => {});

        await this.logAudit(
          "DB_CONNECTION_TEST_SUCCESS",
          "Sucesso",
          `Conectado com sucesso ao MSSQL! Encontradas ${tables.length} tabelas no modo somente-leitura.`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "readonly" }
        );

        return {
          success: true,
          stage: "readonly",
          message: "Conexão estabelecida com sucesso! Modo somente leitura ativado.",
          tables
        };
      } catch (err: any) {
        const errMsg = err.message || "";
        let stage: ConnectionStage = "unknown";
        let message = `Erro na conexão MSSQL: ${errMsg}`;

        if (errMsg.includes("login") || errMsg.includes("Login failed") || errMsg.includes("credentials")) {
          stage = "auth";
          message = "Usuário ou senha inválidos. Falha de autenticação.";
        } else if (errMsg.includes("database") || errMsg.includes("Database") || errMsg.includes("catalog")) {
          stage = "database";
          message = `Banco de dados '${config.database}' não foi encontrado.`;
        }

        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Falha na conexão MSSQL: ${message}`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage, error: errMsg }
        );

        return {
          success: false,
          stage,
          message,
          technicalDetails: errMsg
        };
      }
    } else if (type === "oracle") {
      try {
        const oracledb = await import("oracledb");
        const connectionOptions: any = {
          user: config.user,
          password: config.password,
          connectString: config.connectionString || `${host}:${port}/${config.database}`
        };
        const connection = await oracledb.default.getConnection(connectionOptions);
        await connection.execute("SELECT 1 FROM dual");
        const tablesResult: any = await connection.execute(
          `SELECT table_name FROM user_tables ORDER BY table_name`
        );
        const tables = tablesResult.rows ? tablesResult.rows.map((row: any) => row[0]) : [];
        await connection.close().catch(() => {});

        await this.logAudit(
          "DB_CONNECTION_TEST_SUCCESS",
          "Sucesso",
          `Conectado com sucesso ao Oracle! Encontradas ${tables.length} tabelas no modo somente-leitura.`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "readonly" }
        );

        return {
          success: true,
          stage: "readonly",
          message: "Conexão Oracle estabelecida com sucesso!",
          tables
        };
      } catch (err: any) {
        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Falha na conexão Oracle: ${err.message}`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "unknown", error: err.message }
        );
        return {
          success: false,
          stage: "unknown",
          message: `Erro na conexão Oracle: ${err.message}`
        };
      }
    } else if (type === "mongodb") {
      try {
        const mongodb = await import("mongodb");
        const uri = config.connectionString || `mongodb://${config.user ? `${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@` : ""}${host}:${port}/${config.database}`;
        const client = new mongodb.default.MongoClient(uri);
        await client.connect();
        const db = client.db(config.database || undefined);
        const collections = await db.listCollections().toArray();
        const tables = collections.map(c => c.name);
        await client.close().catch(() => {});

        await this.logAudit(
          "DB_CONNECTION_TEST_SUCCESS",
          "Sucesso",
          `Conectado com sucesso ao MongoDB! Encontradas ${tables.length} coleções.`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "readonly" }
        );

        return {
          success: true,
          stage: "readonly",
          message: "Conexão MongoDB estabelecida com sucesso!",
          tables
        };
      } catch (err: any) {
        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Falha na conexão MongoDB: ${err.message}`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "unknown", error: err.message }
        );
        return {
          success: false,
          stage: "unknown",
          message: `Erro na conexão MongoDB: ${err.message}`
        };
      }
    }

      return {
        success: false,
        stage: "unknown",
        message: "Tipo de banco de dados não suportado."
      };
    } finally {
      if (sshTunnel) {
        await sshTunnel.close().catch(() => {});
      }
    }
  }

  public async testNetworkPath(host: string, port: number, type: DatabaseType = "mysql"): Promise<DatabaseConnectionResult> {
    const context = await this.diagnoseNetworkContext(host, port, type);
    const stages: ConnectionStageResult[] = [];
    if (context.routeProbe.resolvedAddress) {
      stages.push({ stage: "route", status: context.routeProbe.status === "failed" ? "failed" : "passed", message: context.routeProbe.error || "Rota consultada pelo processo Node." });
      stages.push({ stage: "host", status: "passed", message: "Host resolvido pelo processo Node." });
    }
    if (!context.tcpProbe.connected) {
      if (!context.routeProbe.resolvedAddress) {
        stages.push({ stage: "host", status: "failed", message: "Host não resolvido pelo processo Node." });
      }
      stages.push({ stage: "port", status: "failed", message: context.tcpProbe.error || `Socket TCP não abriu em ${host}:${port}.` });
      return {
        success: false,
        stage: context.tcpProbe.status === "skipped"
          ? "host"
          : "port",
        message: context.tcpProbe.status === "skipped"
          ? `Host '${host}' não pôde ser resolvido pelo processo Node.`
          : `Não foi possível abrir o socket TCP para ${host}:${port} neste processo Node.`,
        technicalDetails: `${context.tcpProbe.code || context.routeProbe.code || "sem código"}: ${context.tcpProbe.error || context.routeProbe.error || "timeout/refused"}`,
        diagnostics: { correlationId: createCorrelationId(), runtime: context.runtime, target: context.target, stages, stageTimings: [] },
      };
    }

    stages.push(
      { stage: "port", status: "passed", message: "Socket TCP aberto; autenticação ainda não foi testada." },
    );
    return {
      success: true,
      stage: "port",
      message: `Socket TCP aberto em ${host}:${port}. Isso prova alcance de rede, não autenticação nem VPN.`,
      diagnostics: { correlationId: createCorrelationId(), runtime: context.runtime, target: context.target, stages, stageTimings: [] },
    };
  }

  /**
   * Retrieves tables, their schema columns, and estimated row counts.
   */
  public async getTablesAndColumns(configPayload: any): Promise<{ success: boolean; tables: string[]; tableColumns: Record<string, { name: string; type: string }[]>; estimatedRows: Record<string, number> }> {
    const { type, host, port, user, password, database, connectionString, ssl, useSshTunnel } = configPayload;

    let sshTunnel: any = null;
    let activeHost = host || "localhost";
    let activePort = port;
    let activeConnectionString = connectionString;

    try {
      if (useSshTunnel) {
        let targetHost = host;
        let targetPort = port;
        if (connectionString) {
          try {
            const parsedUrl = new URL(connectionString);
            targetHost = parsedUrl.hostname;
            targetPort = parsedUrl.port || (type === "mysql" ? "3306" : "5432");
          } catch (e) {
            const match = connectionString.match(/@([^:/]+):?(\d+)?/);
            if (match) {
              targetHost = match[1];
              targetPort = match[2] || (type === "mysql" ? "3306" : "5432");
            }
          }
        }
        sshTunnel = await this.setupSshTunnel({
          sshHost: configPayload.sshHost,
          sshPort: configPayload.sshPort,
          sshUser: configPayload.sshUser,
          sshPassword: configPayload.sshPassword,
          sshPrivateKey: configPayload.sshPrivateKey,
          host: targetHost,
          port: targetPort
        });
        activeHost = sshTunnel.localHost;
        activePort = String(sshTunnel.localPort);

        if (connectionString) {
          try {
            const parsedUrl = new URL(connectionString);
            parsedUrl.hostname = "127.0.0.1";
            parsedUrl.port = String(sshTunnel.localPort);
            activeConnectionString = parsedUrl.toString();
          } catch (e) {
            if (targetHost && targetPort) {
              activeConnectionString = connectionString
                .replace(`@${targetHost}:${targetPort}`, `@127.0.0.1:${sshTunnel.localPort}`)
                .replace(`@${targetHost}`, `@127.0.0.1:${sshTunnel.localPort}`);
            }
          }
        }
      }

      let tables: string[] = [];
      const tableColumns: Record<string, { name: string; type: string }[]> = {};
      const estimatedRows: Record<string, number> = {};

      if (type === "postgres") {
        const pg = await import("pg");
        const config: any = activeConnectionString
          ? { connectionString: activeConnectionString }
          : { host: activeHost, port: Number(activePort || 5432), user, password, database };

        if (ssl) {
          config.ssl = { rejectUnauthorized: false };
        }

        const client = new pg.default.Client(config);
        await client.connect();

        const tablesResult = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `);
        tables = tablesResult.rows.map(row => row.table_name);

        const columnsResult = await client.query(`
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `);

        columnsResult.rows.forEach(col => {
          if (!tableColumns[col.table_name]) {
            tableColumns[col.table_name] = [];
          }
          tableColumns[col.table_name].push({
            name: col.column_name,
            type: col.data_type
          });
        });

        try {
          const estResult = await client.query(`
            SELECT relname AS table_name, n_live_tup AS row_count
            FROM pg_stat_user_tables;
          `);
          estResult.rows.forEach(r => {
            estimatedRows[r.table_name] = Number(r.row_count) || 0;
          });
        } catch (err) {
          platformLogger.warn("Postgres Row Estimate count error:", err);
        }

        tables.forEach(t => {
          if (estimatedRows[t] === undefined || estimatedRows[t] === 0) {
            estimatedRows[t] = -1;
          }
        });

        await client.end().catch(() => {});

      } else if (type === "mysql") {
        const mysql = await import("mysql2/promise");
        const config: any = activeConnectionString
          ? activeConnectionString
          : { host: activeHost, port: Number(activePort || 3306), user, password, database };

        if (ssl) {
          config.ssl = { rejectUnauthorized: false };
        }

        const connection = await mysql.default.createConnection(config);

        const [tablesRows]: any = await connection.query("SHOW TABLES");
        tables = tablesRows.map((row: any) => Object.values(row)[0]);

        for (const table of tables) {
          try {
            const [cols]: any = await connection.query(`DESCRIBE \`${table}\``);
            tableColumns[table] = cols.map((c: any) => ({
              name: c.Field,
              type: c.Type
            }));
          } catch (e: any) {
            platformLogger.warn(`[Aviso Colunas] Selecao de colunas tabela ${table}:`, e.message);
          }
        }

        try {
          const [statusRows]: any = await connection.query("SHOW TABLE STATUS");
          statusRows.forEach((r: any) => {
            if (r && r.Name) {
              estimatedRows[r.Name] = Number(r.Rows) || 0;
            }
          });
        } catch (err) {
          platformLogger.warn("MySQL Row Estimate count error:", err);
        }

        tables.forEach(t => {
          if (estimatedRows[t] === undefined || estimatedRows[t] === 0) {
            estimatedRows[t] = -1;
          }
        });

        await connection.end().catch(() => {});

      } else if (type === "mssql") {
        const mssql = await import("mssql");
        const config: any = activeConnectionString
          ? activeConnectionString
          : {
              server: activeHost,
              port: Number(activePort || 1433),
              user,
              password,
              database,
              options: {
                encrypt: ssl,
                trustServerCertificate: true
              }
            };

        const pool = await mssql.default.connect(config);

        const tablesResult = await pool.request().query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_type = 'BASE TABLE'
          ORDER BY table_name;
        `);
        tables = tablesResult.recordset.map(row => row.table_name || row.TABLE_NAME || "");

        const columnsResult = await pool.request().query(`
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          ORDER BY table_name, ordinal_position;
        `);

        columnsResult.recordset.forEach(col => {
          const tName = col.table_name || col.TABLE_NAME;
          const cName = col.column_name || col.COLUMN_NAME;
          const dType = col.data_type || col.DATA_TYPE;
          if (tName) {
            if (!tableColumns[tName]) {
              tableColumns[tName] = [];
            }
            tableColumns[tName].push({
              name: cName,
              type: dType
            });
          }
        });

        tables.forEach(t => {
          estimatedRows[t] = -1;
        });

        await pool.close().catch(() => {});

      } else if (type === "oracle") {
        const oracledb = await import("oracledb");
        const connectionOptions: any = {
          user,
          password,
          connectString: activeConnectionString || `${activeHost}:${activePort || 1521}/${database}`
        };

        const connection = await oracledb.default.getConnection(connectionOptions);

        const tablesResult: any = await connection.execute(
          `SELECT table_name FROM user_tables ORDER BY table_name`
        );
        tables = tablesResult.rows ? tablesResult.rows.map((row: any) => row[0]) : [];

        const columnsResult: any = await connection.execute(
          `SELECT table_name, column_name, data_type FROM user_tab_cols ORDER BY table_name, column_id`
        );

        if (columnsResult.rows) {
          columnsResult.rows.forEach((row: any) => {
            const tName = row[0];
            const cName = row[1];
            const dType = row[2];
            if (!tableColumns[tName]) {
              tableColumns[tName] = [];
            }
            tableColumns[tName].push({
              name: cName,
              type: dType
            });
          });
        }

        tables.forEach(t => {
          estimatedRows[t] = -1;
        });

        await connection.close().catch(() => {});

      } else if (type === "mongodb") {
        const mongodb = await import("mongodb");
        const uri = activeConnectionString || `mongodb://${user ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@` : ""}${activeHost}:${activePort || 27017}/${database}`;
        const client = new mongodb.default.MongoClient(uri);
        await client.connect();
        const db = client.db(database || undefined);

        const collections = await db.listCollections().toArray();
        tables = collections.map(c => c.name);

        for (const colName of tables) {
          const doc = await db.collection(colName).findOne();
          if (doc) {
            tableColumns[colName] = Object.keys(doc).map(key => {
              const val = doc[key];
              const type = typeof val;
              return { name: key, type };
            });
          } else {
            tableColumns[colName] = [];
          }
        }

        tables.forEach(t => {
          estimatedRows[t] = -1;
        });

        await client.close().catch(() => {});
      }

      await this.logAudit(
        "DB_TABLES_LISTED",
        "Sucesso",
        `Catalogados de tabelas e colunas gerados com sucesso para ${type?.toUpperCase()}. Total de tabelas: ${tables.length}`,
        user || "lmarcanjo16@gmail.com",
        { type, tablesCount: tables.length }
      );

      return { success: true, tables, tableColumns, estimatedRows };

    } finally {
      if (sshTunnel) {
        await sshTunnel.close().catch((err: any) => {
          platformLogger.warn(`[SSH Tunnel List Tables Close] Finalizacao:`, err.message);
        });
      }
    }
  }

  /**
   * Fetches, filters, maps, and validates database tables/queries into LancamentoFinanceiro format.
   */
  public async executeFetchAndMap(configPayload: any): Promise<any[]> {
    const normalized = normalizeDatabaseConfig(configPayload);
    if ("message" in normalized) throw new Error(normalized.message);
    const {
      type, host, port, user, password, database, connectionString, ssl, tableName, query, mappings,
      useSshTunnel
    } = { ...configPayload, type: normalized.config.type, tableName: normalized.config.table || configPayload.tableName };

    if (query && query.trim() !== "") {
      try {
        this.assertReadOnlyQuery(query);
      } catch (err: any) {
        await this.logAudit(
          "DB_QUERY_BLOCKED_READONLY",
          "Blocked",
          `Consulta SQL bloqueada por regras de segurança: ${err.message}`,
          user || "lmarcanjo16@gmail.com",
          { query }
        );
        throw err;
      }
    }

    let rawRows: any[] = [];
    let sshTunnel: any = null;
    let activeHost = host || "localhost";
    let activePort = port;
    let activeConnectionString = connectionString;

    try {
      if (useSshTunnel) {
        let targetHost = host;
        let targetPort = port;
        if (connectionString) {
          try {
            const parsedUrl = new URL(connectionString);
            targetHost = parsedUrl.hostname;
            targetPort = parsedUrl.port || (type === "mysql" ? "3306" : "5432");
          } catch (e) {
            const match = connectionString.match(/@([^:/]+):?(\d+)?/);
            if (match) {
              targetHost = match[1];
              targetPort = match[2] || (type === "mysql" ? "3306" : "5432");
            }
          }
        }
        sshTunnel = await this.setupSshTunnel({
          sshHost: configPayload.sshHost,
          sshPort: configPayload.sshPort,
          sshUser: configPayload.sshUser,
          sshPassword: configPayload.sshPassword,
          sshPrivateKey: configPayload.sshPrivateKey,
          host: targetHost,
          port: targetPort
        });
        activeHost = sshTunnel.localHost;
        activePort = String(sshTunnel.localPort);

        if (connectionString) {
          try {
            const parsedUrl = new URL(connectionString);
            parsedUrl.hostname = "127.0.0.1";
            parsedUrl.port = String(sshTunnel.localPort);
            activeConnectionString = parsedUrl.toString();
          } catch (e) {
            if (targetHost && targetPort) {
              activeConnectionString = connectionString
                .replace(`@${targetHost}:${targetPort}`, `@127.0.0.1:${sshTunnel.localPort}`)
                .replace(`@${targetHost}`, `@127.0.0.1:${sshTunnel.localPort}`);
            }
          }
        }
      }

      if (type === "postgres") {
        const pg = await import("pg");
        const config: any = activeConnectionString
          ? { connectionString: activeConnectionString }
          : { host: activeHost, port: Number(activePort || 5432), user, password, database };

        if (ssl) {
          config.ssl = { rejectUnauthorized: false };
        }

        const client = new pg.default.Client(config);
        await client.connect();

        let tablesToQuery: string[] = [];
        if (tableName === "__ALL_TABLES__") {
          const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
          `);
          tablesToQuery = tablesResult.rows.map(row => row.table_name);
        } else if (configPayload.tableNames && Array.isArray(configPayload.tableNames)) {
          tablesToQuery = configPayload.tableNames;
        } else if (tableName && tableName.includes(",")) {
          tablesToQuery = tableName.split(",").map((t: string) => t.trim());
        } else if (tableName) {
          tablesToQuery = [tableName];
        }

        if (query && query.trim() !== "") {
          const queryResult = await client.query(query);
          rawRows = queryResult.rows;
        } else if (tablesToQuery.length > 0) {
          rawRows = [];
          for (const t of tablesToQuery) {
            try {
              const res = await client.query(`SELECT * FROM "${t}" LIMIT 2000;`);
              const rowsWithTable = res.rows.map(r => ({ ...r, __sourceTable: t }));
              rawRows.push(...rowsWithTable);
            } catch (e: any) {
              platformLogger.warn(`Erro ao ler da tabela Postgres ${t}:`, e.message);
            }
          }
        } else {
          await client.end().catch(() => {});
          throw new Error("Tabela ou consulta SQL não especificada.");
        }

        await client.end().catch(() => {});

      } else if (type === "mysql") {
        const mysql = await import("mysql2/promise");
        const config: any = activeConnectionString
          ? activeConnectionString
          : { host: activeHost, port: Number(activePort || 3306), user, password, database };

        if (ssl) {
          config.ssl = { rejectUnauthorized: false };
        }

        const connection = await mysql.default.createConnection(config);

        let tablesToQuery: string[] = [];
        if (tableName === "__ALL_TABLES__") {
          const [tablesRows]: any = await connection.query("SHOW TABLES");
          tablesToQuery = tablesRows.map((row: any) => Object.values(row)[0]);
        } else if (configPayload.tableNames && Array.isArray(configPayload.tableNames)) {
          tablesToQuery = configPayload.tableNames;
        } else if (tableName && tableName.includes(",")) {
          tablesToQuery = tableName.split(",").map((t: string) => t.trim());
        } else if (tableName) {
          tablesToQuery = [tableName];
        }

        if (query && query.trim() !== "") {
          const [rows]: any = await connection.query(query);
          rawRows = rows;
        } else if (tablesToQuery.length > 0) {
          rawRows = [];
          for (const t of tablesToQuery) {
            try {
              const [res]: any = await connection.query(`SELECT * FROM \`${t}\` LIMIT 2000;`);
              const rowsWithTable = res.map((r: any) => ({ ...r, __sourceTable: t }));
              rawRows.push(...rowsWithTable);
            } catch (e: any) {
              platformLogger.warn(`Erro ao ler da tabela MySQL ${t}:`, e.message);
            }
          }
        } else {
          await connection.end().catch(() => {});
          throw new Error("Tabela ou consulta SQL não especificada.");
        }

        await connection.end().catch(() => {});

      } else if (type === "mssql") {
        const mssql = await import("mssql");
        const config: any = activeConnectionString
          ? activeConnectionString
          : {
              server: activeHost,
              port: Number(activePort || 1433),
              user,
              password,
              database,
              options: {
                encrypt: ssl,
                trustServerCertificate: true
              }
            };

        const pool = await mssql.default.connect(config);

        if (query && query.trim() !== "") {
          const result = await pool.request().query(query);
          rawRows = result.recordset;
        } else if (tableName === "__ALL_TABLES__") {
          const tablesResult = await pool.request().query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
            ORDER BY table_name;
          `);
          const tables = tablesResult.recordset.map(row => row.table_name || row.TABLE_NAME || "");
          rawRows = [];
          for (const t of tables) {
            if (!t) continue;
            try {
              const res = await pool.request().query(`SELECT TOP 1000 * FROM [${t}];`);
              const rowsWithTable = res.recordset.map((r: any) => ({ ...r, __sourceTable: t }));
              rawRows.push(...rowsWithTable);
            } catch (e: any) {
              platformLogger.warn(`Erro ao ler da tabela MSSQL ${t}:`, e.message);
            }
          }
        } else if (tableName) {
          const sql = `SELECT TOP 5000 * FROM [${tableName}];`;
          const result = await pool.request().query(sql);
          rawRows = result.recordset;
        } else {
          await pool.close().catch(() => {});
          throw new Error("Tabela ou consulta SQL não especificada.");
        }

        await pool.close().catch(() => {});

      } else if (type === "oracle") {
        const oracledb = await import("oracledb");
        const connectionOptions: any = {
          user,
          password,
          connectString: activeConnectionString || `${activeHost}:${activePort || 1521}/${database}`
        };

        const connection = await oracledb.default.getConnection(connectionOptions);

        if (query && query.trim() !== "") {
          const result: any = await connection.execute(query, {}, { outFormat: oracledb.default.OUT_FORMAT_OBJECT });
          rawRows = result.rows || [];
        } else if (tableName === "__ALL_TABLES__") {
          const tablesResult: any = await connection.execute(
            `SELECT table_name FROM user_tables ORDER BY table_name`
          );
          const tables = tablesResult.rows ? tablesResult.rows.map((row: any) => row[0]) : [];
          rawRows = [];
          for (const t of tables) {
            try {
              const res: any = await connection.execute(
                `SELECT * FROM "${t}" FETCH FIRST 1000 ROWS ONLY`,
                {},
                { outFormat: oracledb.default.OUT_FORMAT_OBJECT }
              );
              const rowsWithTable = (res.rows || []).map((r: any) => ({ ...r, __sourceTable: t }));
              rawRows.push(...rowsWithTable);
            } catch (e: any) {
              platformLogger.warn(`Erro ao ler da tabela Oracle ${t}:`, e.message);
            }
          }
        } else if (tableName) {
          const sql = `SELECT * FROM "${tableName}" FETCH FIRST 5000 ROWS ONLY`;
          const result: any = await connection.execute(sql, {}, { outFormat: oracledb.default.OUT_FORMAT_OBJECT });
          rawRows = result.rows || [];
        } else {
          await connection.close().catch(() => {});
          throw new Error("Tabela ou consulta SQL não especificada.");
        }

        await connection.close().catch(() => {});

      } else if (type === "mongodb") {
        const mongodb = await import("mongodb");
        const uri = activeConnectionString || `mongodb://${user ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@` : ""}${activeHost}:${activePort || 27017}/${database}`;
        const client = new mongodb.default.MongoClient(uri);
        await client.connect();
        const db = client.db(database || undefined);

        if (tableName === "__ALL_TABLES__") {
          const collections = await db.listCollections().toArray();
          const tables = collections.map(c => c.name);
          rawRows = [];
          for (const t of tables) {
            try {
              const docs = await db.collection(t).find({}).limit(1000).toArray();
              const docsWithTable = docs.map((doc: any) => ({ ...doc, __sourceTable: t }));
              rawRows.push(...docsWithTable);
            } catch (e: any) {
              platformLogger.warn(`Erro ao ler da coleção MongoDB ${t}:`, e.message);
            }
          }
        } else if (tableName) {
          const col = db.collection(tableName);
          let cursor;
          if (query && query.trim() !== "") {
            try {
              const filter = JSON.parse(query);
              cursor = col.find(filter);
            } catch {
              cursor = col.find({});
            }
          } else {
            cursor = col.find({});
          }
          rawRows = await cursor.limit(5000).toArray();
        } else {
          await client.close().catch(() => {});
          throw new Error("Coleção de dados não especificada.");
        }

        await client.close().catch(() => {});
      } else {
        throw new Error("Tipo de banco de dados não suportado.");
      }
    } finally {
      if (sshTunnel) {
        await sshTunnel.close().catch((err: any) => {
              platformLogger.warn(`[SSH Tunnel Fetch Close] Finalizacao:`, err.message);
        });
      }
    }

    // Preserve the physical source when no semantic mapping was selected.
    // The consultant may interpret these columns later; do not fabricate
    // business fields or derived metrics at ingestion time.
    const selectedMappings: Array<[string, string]> = Object.entries(mappings || {})
      .filter(([, column]) => typeof column === "string" && column.trim().length > 0)
      .map(([field, column]) => [field, column as string]);
    if (selectedMappings.length === 0) {
      return rawRows.map((row) => ({
        ...row,
        id: String(row.id || row.ID || row._id || row.uuid || crypto.randomUUID()),
      }));
    }

    // Preserve physical columns alongside only the aliases explicitly mapped.
    // Partial mappings remain valid and do not receive empty or derived data.
    const numericMappedFields = new Set(["Receita", "Custo", "Despesa", "Lucro", "Margem"]);
    const mappedRows = rawRows.map((row) => {
      const mappedRow: Record<string, any> = {
        ...row,
        id: String(row.id || row.ID || row._id || row.uuid || crypto.randomUUID()),
      };

      selectedMappings.forEach(([field, column]) => {
        if (!Object.prototype.hasOwnProperty.call(row, column)) return;
        const rawValue = row[column];
        const numericValue = Number(rawValue);
        mappedRow[field] = numericMappedFields.has(field) && !Number.isNaN(numericValue)
          ? numericValue
          : rawValue;
      });

      return mappedRow;
    });

    return mappedRows;
  }
}

export const databaseConnectionManager = DatabaseConnectionManager.getInstance();
export default databaseConnectionManager;
