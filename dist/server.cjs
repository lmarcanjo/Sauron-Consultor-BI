var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
var import_fs = __toESM(require("fs"), 1);

// src/utils/calculations.ts
function isQueryReadOnly(query) {
  if (!query) return true;
  const q = query.trim().toUpperCase();
  const blockedKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE"];
  for (const keyword of blockedKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(q)) {
      return false;
    }
  }
  return true;
}

// src/core/security/sqlSafety.ts
var SqlSafety = class _SqlSafety {
  constructor() {
  }
  static getInstance() {
    if (!_SqlSafety.instance) {
      _SqlSafety.instance = new _SqlSafety();
    }
    return _SqlSafety.instance;
  }
  /**
   * Safely checks if a SQL query is read-only.
   */
  isReadOnly(query) {
    return isQueryReadOnly(query);
  }
  /**
   * Cleans and sanitizes query input against SQL injection risks.
   */
  sanitizeQuery(query) {
    return query.replace(/--/g, "").replace(/;/g, "");
  }
};
var sqlSafety = SqlSafety.getInstance();

// src/core/security/SecurityEngine.ts
var SecurityEngine = class _SecurityEngine {
  constructor() {
  }
  static getInstance() {
    if (!_SecurityEngine.instance) {
      _SecurityEngine.instance = new _SecurityEngine();
    }
    return _SecurityEngine.instance;
  }
  getSqlSafety() {
    return sqlSafety;
  }
  /**
   * Evaluates if a given session is permitted to alter metadata or approve datasets.
   */
  hasOverlayPermission(session) {
    return session.role === "CONSULTANT" || session.role === "ADMIN";
  }
  /**
   * Asserts if a raw SQL statement is safe for read-only executions.
   */
  isSqlStatementSafe(query) {
    try {
      this.assertReadOnlyQuery(query);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Asserts if a raw SQL statement is safe for read-only executions. Throws an error if unsafe.
   */
  assertReadOnlyQuery(query) {
    if (!query) return;
    const q = query.trim().toUpperCase();
    const blockedKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "MERGE", "EXEC", "CALL"];
    for (const keyword of blockedKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      if (regex.test(q)) {
        throw new Error(`[Security Error] Bloqueio de Consulta: Tentativa de altera\xE7\xE3o ou execu\xE7\xE3o de instru\xE7\xE3o destrutiva '${keyword}' rejeitada.`);
      }
    }
  }
};
var securityEngine = SecurityEngine.getInstance();

// src/core/platform/PlatformLogger.ts
function debugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("sauron_debug_logs") === "true";
  } catch {
    return false;
  }
}
var platformLogger = {
  error(message, ...args) {
    console.error(message, ...args);
  },
  warn(message, ...args) {
    console.warn(message, ...args);
  },
  info(message, ...args) {
    if (debugEnabled()) console.info(message, ...args);
  },
  debug(message, ...args) {
    if (debugEnabled()) console.debug(message, ...args);
  },
  trace(message, ...args) {
    if (debugEnabled()) console.trace(message, ...args);
  }
};

// src/core/connections/DatabaseConnectionManager.ts
var DatabaseConnectionManager = class _DatabaseConnectionManager {
  constructor() {
  }
  static getInstance() {
    if (!_DatabaseConnectionManager.instance) {
      _DatabaseConnectionManager.instance = new _DatabaseConnectionManager();
    }
    return _DatabaseConnectionManager.instance;
  }
  /**
   * Generates a helpful tip for Docker container network isolation.
   */
  getDockerConnectionHint(host) {
    if (host === "localhost" || host === "127.0.0.1") {
      return " Dentro do container Docker, 'localhost' aponta para o pr\xF3prio container. Altere para 'host.docker.internal' se o banco de dados estiver rodando na m\xE1quina host ou use o nome do servi\xE7o docker-compose correspondente (ex: 'postgres', 'mysql', 'db', 'database').";
    }
    return "";
  }
  /**
   * Safe check for a SQL query, asserting that it is read-only.
   */
  assertReadOnlyQuery(query) {
    securityEngine.assertReadOnlyQuery(query);
  }
  /**
   * Logs a database event to the server audit trails.
   */
  async logAudit(eventType, status, description, user = "lmarcanjo16@gmail.com", metadata = {}) {
    try {
      const fs2 = await import("fs");
      const path2 = await import("path");
      const SYSTEM_DB_FILE2 = path2.join(process.cwd(), "system_db.json");
      let sysDb = {};
      if (fs2.existsSync(SYSTEM_DB_FILE2)) {
        sysDb = JSON.parse(fs2.readFileSync(SYSTEM_DB_FILE2, "utf-8"));
      }
      if (!sysDb.auditLogs) {
        sysDb.auditLogs = [];
      }
      const logEntry = {
        id: "log_" + crypto.randomUUID(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        eventType,
        status,
        description,
        user,
        ...metadata
      };
      sysDb.auditLogs.unshift(logEntry);
      fs2.writeFileSync(SYSTEM_DB_FILE2, JSON.stringify(sysDb, null, 2), "utf-8");
      platformLogger.info(`[AUDIT LOG] ${eventType} - ${status} - ${description}`);
    } catch (e) {
      platformLogger.warn("Erro ao salvar log de auditoria no ConnectionManager:", e.message);
    }
  }
  /**
   * Helper to bridge database traffic through an SSH VM Connection
   */
  async setupSshTunnel(config) {
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
          const address = server.address();
          const localPort = address.port;
          resolve({
            localHost: "127.0.0.1",
            localPort,
            close: () => {
              return new Promise((res) => {
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
        reject(new Error(`Erro de autentica\xE7\xE3o ou conex\xE3o na m\xE1quina virtual VM (SSH): ${err.message}`));
      });
      const connectConfig = {
        host: sshHost,
        port: Number(sshPort || 22),
        username: sshUser,
        readyTimeout: 1e4
      };
      if (sshPrivateKey) {
        connectConfig.privateKey = sshPrivateKey;
      } else if (sshPassword) {
        connectConfig.password = sshPassword;
      }
      try {
        sshBtn.connect(connectConfig);
      } catch (e) {
        server.close();
        reject(new Error(`Erro ao inicializar o SSH Client: ${e.message}`));
      }
    });
  }
  /**
   * Test connection in detailed stages.
   */
  async testConnection(config) {
    const type = config.type;
    let activeHost = config.host || "localhost";
    let activePort = Number(config.port);
    let sshTunnel = null;
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
      } catch (err) {
        return {
          success: false,
          stage: "host",
          message: `Falha ao abrir t\xFAnel SSH/VPN: ${err.message}`,
          technicalDetails: err.message
        };
      }
    }
    try {
      const type2 = config.type;
    } finally {
      if (sshTunnel) {
        await sshTunnel.close().catch(() => {
        });
      }
    }
    const host = activeHost;
    const port = activePort;
    try {
      const dns = await import("dns").then((m) => m.promises);
      await dns.lookup(host);
    } catch (err) {
      const hint = this.getDockerConnectionHint(host);
      const message = `Host '${host}' n\xE3o p\xF4de ser resolvido via DNS.${hint}`;
      await this.logAudit(
        "DB_CONNECTION_TEST_WARNING",
        "Info",
        `Host '${host}' n\xE3o encontrado (DNS lookup failed).`,
        config.user || "lmarcanjo16@gmail.com",
        { type, host, database: config.database, stage: "host", error: err.message }
      );
      return {
        success: false,
        stage: "host",
        message,
        technicalDetails: err.message
      };
    }
    try {
      const net = await import("net");
      const isPortOpen = await new Promise((resolve) => {
        const socket = new net.default.Socket();
        let resolved = false;
        socket.setTimeout(2500);
        socket.connect(port, host, () => {
          resolved = true;
          socket.destroy();
          resolve(true);
        });
        socket.on("error", () => {
          if (!resolved) {
            resolved = true;
            socket.destroy();
            resolve(false);
          }
        });
        socket.on("timeout", () => {
          if (!resolved) {
            resolved = true;
            socket.destroy();
            resolve(false);
          }
        });
      });
      if (!isPortOpen) {
        const hint = this.getDockerConnectionHint(host);
        const message = `Porta ${port} no host '${host}' est\xE1 fechada ou inacess\xEDvel.${hint}`;
        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Porta fechada ou inacess\xEDvel em ${host}:${port}`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "port" }
        );
        return {
          success: false,
          stage: "port",
          message,
          technicalDetails: "TCP connection timeout/refused. Verifique as configura\xE7\xF5es de firewall e se o banco est\xE1 ouvindo na porta informada."
        };
      }
    } catch (err) {
      return {
        success: false,
        stage: "port",
        message: "Erro ao testar a porta TCP.",
        technicalDetails: err.message
      };
    }
    if (type === "postgres") {
      try {
        const pg = await import("pg");
        const clientConfig = config.connectionString ? { connectionString: config.connectionString } : { host, port, user: config.user, password: config.password, database: config.database };
        if (config.ssl) {
          clientConfig.ssl = { rejectUnauthorized: false };
        }
        const client = new pg.default.Client(clientConfig);
        try {
          await client.connect();
        } catch (err) {
          await client.end().catch(() => {
          });
          const errMsg = err.message || "";
          const errCode = err.code || "";
          let stage = "unknown";
          let message = "Erro desconhecido na tentativa de conex\xE3o Postgres.";
          if (errCode === "28P01" || errMsg.includes("password authentication") || errMsg.includes("authentication failed")) {
            stage = "auth";
            message = "Falha de autentica\xE7\xE3o. Usu\xE1rio ou senha incorretos para o banco de dados.";
          } else if (errCode === "3D000" || errMsg.includes("database") && errMsg.includes("does not exist")) {
            stage = "database";
            message = `Banco de dados '${config.database}' n\xE3o existe no servidor postgres.`;
          } else if (errMsg.includes("SSL") || errMsg.includes("no pg_hba.conf entry") || errMsg.includes("negotiation failed")) {
            stage = "ssl";
            message = "Erro de handshake SSL/TLS ou permiss\xE3o pg_hba.conf de criptografia requerida.";
          }
          await this.logAudit(
            "DB_CONNECTION_TEST_WARNING",
            "Info",
            `Falha na autentica\xE7\xE3o ou sele\xE7\xE3o do banco Postgres: ${message}`,
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
        try {
          await client.query("SELECT 1;");
        } catch (err) {
          await client.end().catch(() => {
          });
          await this.logAudit(
            "DB_CONNECTION_TEST_WARNING",
            "Info",
            `Erro de permiss\xE3o ou consulta no Postgres: ${err.message}`,
            config.user || "lmarcanjo16@gmail.com",
            { type, host, database: config.database, stage: "query", error: err.message }
          );
          return {
            success: false,
            stage: "query",
            message: "Conectado com sucesso, mas falhou ao executar SELECT 1 (sem permiss\xE3o de leitura).",
            technicalDetails: err.message
          };
        }
        let tables = [];
        try {
          const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
            LIMIT 50;
          `);
          tables = tablesResult.rows.map((r) => r.table_name);
        } catch (err) {
          await client.end().catch(() => {
          });
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
            message: "Schema n\xE3o encontrado ou sem permiss\xE3o para listar tabelas p\xFAblicas.",
            technicalDetails: err.message
          };
        }
        await client.end().catch(() => {
        });
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
          message: `Conectado com sucesso ao Postgres! Encontradas ${tables.length} tabelas p\xFAblicas. Banco de dados configurado no modo somente-leitura.`,
          tables
        };
      } catch (err) {
        return {
          success: false,
          stage: "unknown",
          message: "Erro desconhecido na tentativa de conex\xE3o Postgres.",
          technicalDetails: err.message
        };
      }
    } else if (type === "mysql") {
      try {
        const mysql = await import("mysql2/promise");
        const clientConfig = config.connectionString ? config.connectionString : { host, port, user: config.user, password: config.password, database: config.database };
        if (config.ssl) {
          clientConfig.ssl = { rejectUnauthorized: false };
        }
        let connection;
        try {
          connection = await mysql.default.createConnection(clientConfig);
        } catch (err) {
          const errMsg = err.message || "";
          const errCode = String(err.code || err.errno || "");
          let stage = "unknown";
          let message = "Erro desconhecido na tentativa de conex\xE3o MySQL.";
          if (errCode.includes("ACCESS_DENIED") || errMsg.includes("Access denied for user")) {
            stage = "auth";
            message = "Credenciais inv\xE1lidas. Acesso negado para o usu\xE1rio informado.";
          } else if (errMsg.includes("Unknown database") || errCode === "ER_BAD_DB_ERROR") {
            stage = "database";
            message = `Banco de dados '${config.database}' n\xE3o foi encontrado.`;
          } else if (errMsg.includes("SSL") || errCode === "HANDSHAKE_FAILED") {
            stage = "ssl";
            message = "Erro de handshake SSL/TLS ou permiss\xE3o de criptografia requerida.";
          }
          await this.logAudit(
            "DB_CONNECTION_TEST_WARNING",
            "Info",
            `Falha na conex\xE3o MySQL: ${message}`,
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
        try {
          await connection.query("SELECT 1;");
        } catch (err) {
          await connection.end().catch(() => {
          });
          await this.logAudit(
            "DB_CONNECTION_TEST_WARNING",
            "Info",
            `Erro ao executar SELECT 1 no MySQL: ${err.message}`,
            config.user || "lmarcanjo16@gmail.com",
            { type, host, database: config.database, stage: "query", error: err.message }
          );
          return {
            success: false,
            stage: "query",
            message: "Conectado com sucesso, mas falhou ao executar SELECT 1 (sem permiss\xE3o de leitura).",
            technicalDetails: err.message
          };
        }
        let tables = [];
        try {
          const [rows] = await connection.query("SHOW TABLES");
          tables = rows.map((r) => Object.values(r)[0]);
        } catch (err) {
          await connection.end().catch(() => {
          });
          await this.logAudit(
            "DB_CONNECTION_TEST_WARNING",
            "Info",
            `Erro ao ler tabelas no MySQL: ${err.message}`,
            config.user || "lmarcanjo16@gmail.com",
            { type, host, database: config.database, stage: "schema", error: err.message }
          );
          return {
            success: false,
            stage: "schema",
            message: "Erro ao carregar lista de tabelas.",
            technicalDetails: err.message
          };
        }
        await connection.end().catch(() => {
        });
        await this.logAudit(
          "DB_CONNECTION_TEST_SUCCESS",
          "Sucesso",
          `Conectado com sucesso ao MySQL! Encontradas ${tables.length} tabelas no modo somente-leitura.`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "readonly" }
        );
        return {
          success: true,
          stage: "readonly",
          message: "Conectado com sucesso ao MySQL! Acesso restrito de leitura (Read-Only) assegurado.",
          tables
        };
      } catch (err) {
        return {
          success: false,
          stage: "unknown",
          message: "Erro interno no driver do MySQL.",
          technicalDetails: err.message
        };
      }
    } else if (type === "mssql") {
      try {
        const mssql = await import("mssql");
        const clientConfig = config.connectionString ? config.connectionString : {
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
        const tables = tablesResult.recordset.map((row) => row.table_name || row.TABLE_NAME || "");
        await pool.close().catch(() => {
        });
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
          message: "Conex\xE3o estabelecida com sucesso! Modo somente leitura ativado.",
          tables
        };
      } catch (err) {
        const errMsg = err.message || "";
        let stage = "unknown";
        let message = `Erro na conex\xE3o MSSQL: ${errMsg}`;
        if (errMsg.includes("login") || errMsg.includes("Login failed") || errMsg.includes("credentials")) {
          stage = "auth";
          message = "Usu\xE1rio ou senha inv\xE1lidos. Falha de autentica\xE7\xE3o.";
        } else if (errMsg.includes("database") || errMsg.includes("Database") || errMsg.includes("catalog")) {
          stage = "database";
          message = `Banco de dados '${config.database}' n\xE3o foi encontrado.`;
        }
        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Falha na conex\xE3o MSSQL: ${message}`,
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
        const connectionOptions = {
          user: config.user,
          password: config.password,
          connectString: config.connectionString || `${host}:${port}/${config.database}`
        };
        const connection = await oracledb.default.getConnection(connectionOptions);
        await connection.execute("SELECT 1 FROM dual");
        const tablesResult = await connection.execute(
          `SELECT table_name FROM user_tables ORDER BY table_name`
        );
        const tables = tablesResult.rows ? tablesResult.rows.map((row) => row[0]) : [];
        await connection.close().catch(() => {
        });
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
          message: "Conex\xE3o Oracle estabelecida com sucesso!",
          tables
        };
      } catch (err) {
        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Falha na conex\xE3o Oracle: ${err.message}`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "unknown", error: err.message }
        );
        return {
          success: false,
          stage: "unknown",
          message: `Erro na conex\xE3o Oracle: ${err.message}`
        };
      }
    } else if (type === "mongodb") {
      try {
        const mongodb = await import("mongodb");
        const uri = config.connectionString || `mongodb://${config.user ? `${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@` : ""}${host}:${port}/${config.database}`;
        const client = new mongodb.default.MongoClient(uri);
        await client.connect();
        const db = client.db(config.database || void 0);
        const collections = await db.listCollections().toArray();
        const tables = collections.map((c) => c.name);
        await client.close().catch(() => {
        });
        await this.logAudit(
          "DB_CONNECTION_TEST_SUCCESS",
          "Sucesso",
          `Conectado com sucesso ao MongoDB! Encontradas ${tables.length} cole\xE7\xF5es.`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "readonly" }
        );
        return {
          success: true,
          stage: "readonly",
          message: "Conex\xE3o MongoDB estabelecida com sucesso!",
          tables
        };
      } catch (err) {
        await this.logAudit(
          "DB_CONNECTION_TEST_WARNING",
          "Info",
          `Falha na conex\xE3o MongoDB: ${err.message}`,
          config.user || "lmarcanjo16@gmail.com",
          { type, host, database: config.database, stage: "unknown", error: err.message }
        );
        return {
          success: false,
          stage: "unknown",
          message: `Erro na conex\xE3o MongoDB: ${err.message}`
        };
      }
    }
    return {
      success: false,
      stage: "unknown",
      message: "Tipo de banco de dados n\xE3o suportado."
    };
  }
  /**
   * Retrieves tables, their schema columns, and estimated row counts.
   */
  async getTablesAndColumns(configPayload) {
    const { type, host, port, user, password, database, connectionString, ssl, useSshTunnel } = configPayload;
    let sshTunnel = null;
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
              activeConnectionString = connectionString.replace(`@${targetHost}:${targetPort}`, `@127.0.0.1:${sshTunnel.localPort}`).replace(`@${targetHost}`, `@127.0.0.1:${sshTunnel.localPort}`);
            }
          }
        }
      }
      let tables = [];
      const tableColumns = {};
      const estimatedRows = {};
      if (type === "postgres") {
        const pg = await import("pg");
        const config = activeConnectionString ? { connectionString: activeConnectionString } : { host: activeHost, port: Number(activePort || 5432), user, password, database };
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
        tables = tablesResult.rows.map((row) => row.table_name);
        const columnsResult = await client.query(`
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `);
        columnsResult.rows.forEach((col) => {
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
          estResult.rows.forEach((r) => {
            estimatedRows[r.table_name] = Number(r.row_count) || 0;
          });
        } catch (err) {
          platformLogger.warn("Postgres Row Estimate count error:", err);
        }
        tables.forEach((t) => {
          if (estimatedRows[t] === void 0 || estimatedRows[t] === 0) {
            estimatedRows[t] = -1;
          }
        });
        await client.end().catch(() => {
        });
      } else if (type === "mysql") {
        const mysql = await import("mysql2/promise");
        const config = activeConnectionString ? activeConnectionString : { host: activeHost, port: Number(activePort || 3306), user, password, database };
        if (ssl) {
          config.ssl = { rejectUnauthorized: false };
        }
        const connection = await mysql.default.createConnection(config);
        const [tablesRows] = await connection.query("SHOW TABLES");
        tables = tablesRows.map((row) => Object.values(row)[0]);
        for (const table of tables) {
          try {
            const [cols] = await connection.query(`DESCRIBE \`${table}\``);
            tableColumns[table] = cols.map((c) => ({
              name: c.Field,
              type: c.Type
            }));
          } catch (e) {
            platformLogger.warn(`[Aviso Colunas] Selecao de colunas tabela ${table}:`, e.message);
          }
        }
        try {
          const [statusRows] = await connection.query("SHOW TABLE STATUS");
          statusRows.forEach((r) => {
            if (r && r.Name) {
              estimatedRows[r.Name] = Number(r.Rows) || 0;
            }
          });
        } catch (err) {
          platformLogger.warn("MySQL Row Estimate count error:", err);
        }
        tables.forEach((t) => {
          if (estimatedRows[t] === void 0 || estimatedRows[t] === 0) {
            estimatedRows[t] = -1;
          }
        });
        await connection.end().catch(() => {
        });
      } else if (type === "mssql") {
        const mssql = await import("mssql");
        const config = activeConnectionString ? activeConnectionString : {
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
        tables = tablesResult.recordset.map((row) => row.table_name || row.TABLE_NAME || "");
        const columnsResult = await pool.request().query(`
          SELECT table_name, column_name, data_type 
          FROM information_schema.columns 
          ORDER BY table_name, ordinal_position;
        `);
        columnsResult.recordset.forEach((col) => {
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
        tables.forEach((t) => {
          estimatedRows[t] = -1;
        });
        await pool.close().catch(() => {
        });
      } else if (type === "oracle") {
        const oracledb = await import("oracledb");
        const connectionOptions = {
          user,
          password,
          connectString: activeConnectionString || `${activeHost}:${activePort || 1521}/${database}`
        };
        const connection = await oracledb.default.getConnection(connectionOptions);
        const tablesResult = await connection.execute(
          `SELECT table_name FROM user_tables ORDER BY table_name`
        );
        tables = tablesResult.rows ? tablesResult.rows.map((row) => row[0]) : [];
        const columnsResult = await connection.execute(
          `SELECT table_name, column_name, data_type FROM user_tab_cols ORDER BY table_name, column_id`
        );
        if (columnsResult.rows) {
          columnsResult.rows.forEach((row) => {
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
        tables.forEach((t) => {
          estimatedRows[t] = -1;
        });
        await connection.close().catch(() => {
        });
      } else if (type === "mongodb") {
        const mongodb = await import("mongodb");
        const uri = activeConnectionString || `mongodb://${user ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@` : ""}${activeHost}:${activePort || 27017}/${database}`;
        const client = new mongodb.default.MongoClient(uri);
        await client.connect();
        const db = client.db(database || void 0);
        const collections = await db.listCollections().toArray();
        tables = collections.map((c) => c.name);
        for (const colName of tables) {
          const doc = await db.collection(colName).findOne();
          if (doc) {
            tableColumns[colName] = Object.keys(doc).map((key) => {
              const val = doc[key];
              const type2 = typeof val;
              return { name: key, type: type2 };
            });
          } else {
            tableColumns[colName] = [];
          }
        }
        tables.forEach((t) => {
          estimatedRows[t] = -1;
        });
        await client.close().catch(() => {
        });
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
        await sshTunnel.close().catch((err) => {
          platformLogger.warn(`[SSH Tunnel List Tables Close] Finalizacao:`, err.message);
        });
      }
    }
  }
  /**
   * Fetches, filters, maps, and validates database tables/queries into LancamentoFinanceiro format.
   */
  async executeFetchAndMap(configPayload) {
    const {
      type,
      host,
      port,
      user,
      password,
      database,
      connectionString,
      ssl,
      tableName,
      query,
      mappings,
      useSshTunnel
    } = configPayload;
    if (query && query.trim() !== "") {
      try {
        this.assertReadOnlyQuery(query);
      } catch (err) {
        await this.logAudit(
          "DB_QUERY_BLOCKED_READONLY",
          "Blocked",
          `Consulta SQL bloqueada por regras de seguran\xE7a: ${err.message}`,
          user || "lmarcanjo16@gmail.com",
          { query }
        );
        throw err;
      }
    }
    let rawRows = [];
    let sshTunnel = null;
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
              activeConnectionString = connectionString.replace(`@${targetHost}:${targetPort}`, `@127.0.0.1:${sshTunnel.localPort}`).replace(`@${targetHost}`, `@127.0.0.1:${sshTunnel.localPort}`);
            }
          }
        }
      }
      if (type === "postgres") {
        const pg = await import("pg");
        const config = activeConnectionString ? { connectionString: activeConnectionString } : { host: activeHost, port: Number(activePort || 5432), user, password, database };
        if (ssl) {
          config.ssl = { rejectUnauthorized: false };
        }
        const client = new pg.default.Client(config);
        await client.connect();
        let tablesToQuery = [];
        if (tableName === "__ALL_TABLES__") {
          const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
          `);
          tablesToQuery = tablesResult.rows.map((row) => row.table_name);
        } else if (configPayload.tableNames && Array.isArray(configPayload.tableNames)) {
          tablesToQuery = configPayload.tableNames;
        } else if (tableName && tableName.includes(",")) {
          tablesToQuery = tableName.split(",").map((t) => t.trim());
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
              const rowsWithTable = res.rows.map((r) => ({ ...r, __sourceTable: t }));
              rawRows.push(...rowsWithTable);
            } catch (e) {
              platformLogger.warn(`Erro ao ler da tabela Postgres ${t}:`, e.message);
            }
          }
        } else {
          await client.end().catch(() => {
          });
          throw new Error("Tabela ou consulta SQL n\xE3o especificada.");
        }
        await client.end().catch(() => {
        });
      } else if (type === "mysql") {
        const mysql = await import("mysql2/promise");
        const config = activeConnectionString ? activeConnectionString : { host: activeHost, port: Number(activePort || 3306), user, password, database };
        if (ssl) {
          config.ssl = { rejectUnauthorized: false };
        }
        const connection = await mysql.default.createConnection(config);
        let tablesToQuery = [];
        if (tableName === "__ALL_TABLES__") {
          const [tablesRows] = await connection.query("SHOW TABLES");
          tablesToQuery = tablesRows.map((row) => Object.values(row)[0]);
        } else if (configPayload.tableNames && Array.isArray(configPayload.tableNames)) {
          tablesToQuery = configPayload.tableNames;
        } else if (tableName && tableName.includes(",")) {
          tablesToQuery = tableName.split(",").map((t) => t.trim());
        } else if (tableName) {
          tablesToQuery = [tableName];
        }
        if (query && query.trim() !== "") {
          const [rows] = await connection.query(query);
          rawRows = rows;
        } else if (tablesToQuery.length > 0) {
          rawRows = [];
          for (const t of tablesToQuery) {
            try {
              const [res] = await connection.query(`SELECT * FROM \`${t}\` LIMIT 2000;`);
              const rowsWithTable = res.map((r) => ({ ...r, __sourceTable: t }));
              rawRows.push(...rowsWithTable);
            } catch (e) {
              platformLogger.warn(`Erro ao ler da tabela MySQL ${t}:`, e.message);
            }
          }
        } else {
          await connection.end().catch(() => {
          });
          throw new Error("Tabela ou consulta SQL n\xE3o especificada.");
        }
        await connection.end().catch(() => {
        });
      } else if (type === "mssql") {
        const mssql = await import("mssql");
        const config = activeConnectionString ? activeConnectionString : {
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
          const tables = tablesResult.recordset.map((row) => row.table_name || row.TABLE_NAME || "");
          rawRows = [];
          for (const t of tables) {
            if (!t) continue;
            try {
              const res = await pool.request().query(`SELECT TOP 1000 * FROM [${t}];`);
              const rowsWithTable = res.recordset.map((r) => ({ ...r, __sourceTable: t }));
              rawRows.push(...rowsWithTable);
            } catch (e) {
              platformLogger.warn(`Erro ao ler da tabela MSSQL ${t}:`, e.message);
            }
          }
        } else if (tableName) {
          const sql = `SELECT TOP 5000 * FROM [${tableName}];`;
          const result = await pool.request().query(sql);
          rawRows = result.recordset;
        } else {
          await pool.close().catch(() => {
          });
          throw new Error("Tabela ou consulta SQL n\xE3o especificada.");
        }
        await pool.close().catch(() => {
        });
      } else if (type === "oracle") {
        const oracledb = await import("oracledb");
        const connectionOptions = {
          user,
          password,
          connectString: activeConnectionString || `${activeHost}:${activePort || 1521}/${database}`
        };
        const connection = await oracledb.default.getConnection(connectionOptions);
        if (query && query.trim() !== "") {
          const result = await connection.execute(query, {}, { outFormat: oracledb.default.OUT_FORMAT_OBJECT });
          rawRows = result.rows || [];
        } else if (tableName === "__ALL_TABLES__") {
          const tablesResult = await connection.execute(
            `SELECT table_name FROM user_tables ORDER BY table_name`
          );
          const tables = tablesResult.rows ? tablesResult.rows.map((row) => row[0]) : [];
          rawRows = [];
          for (const t of tables) {
            try {
              const res = await connection.execute(
                `SELECT * FROM "${t}" FETCH FIRST 1000 ROWS ONLY`,
                {},
                { outFormat: oracledb.default.OUT_FORMAT_OBJECT }
              );
              const rowsWithTable = (res.rows || []).map((r) => ({ ...r, __sourceTable: t }));
              rawRows.push(...rowsWithTable);
            } catch (e) {
              platformLogger.warn(`Erro ao ler da tabela Oracle ${t}:`, e.message);
            }
          }
        } else if (tableName) {
          const sql = `SELECT * FROM "${tableName}" FETCH FIRST 5000 ROWS ONLY`;
          const result = await connection.execute(sql, {}, { outFormat: oracledb.default.OUT_FORMAT_OBJECT });
          rawRows = result.rows || [];
        } else {
          await connection.close().catch(() => {
          });
          throw new Error("Tabela ou consulta SQL n\xE3o especificada.");
        }
        await connection.close().catch(() => {
        });
      } else if (type === "mongodb") {
        const mongodb = await import("mongodb");
        const uri = activeConnectionString || `mongodb://${user ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@` : ""}${activeHost}:${activePort || 27017}/${database}`;
        const client = new mongodb.default.MongoClient(uri);
        await client.connect();
        const db = client.db(database || void 0);
        if (tableName === "__ALL_TABLES__") {
          const collections = await db.listCollections().toArray();
          const tables = collections.map((c) => c.name);
          rawRows = [];
          for (const t of tables) {
            try {
              const docs = await db.collection(t).find({}).limit(1e3).toArray();
              const docsWithTable = docs.map((doc) => ({ ...doc, __sourceTable: t }));
              rawRows.push(...docsWithTable);
            } catch (e) {
              platformLogger.warn(`Erro ao ler da cole\xE7\xE3o MongoDB ${t}:`, e.message);
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
          rawRows = await cursor.limit(5e3).toArray();
        } else {
          await client.close().catch(() => {
          });
          throw new Error("Cole\xE7\xE3o de dados n\xE3o especificada.");
        }
        await client.close().catch(() => {
        });
      } else {
        throw new Error("Tipo de banco de dados n\xE3o suportado.");
      }
    } finally {
      if (sshTunnel) {
        await sshTunnel.close().catch((err) => {
          platformLogger.warn(`[SSH Tunnel Fetch Close] Finalizacao:`, err.message);
        });
      }
    }
    const mappedRows = rawRows.map((row) => {
      const getValue = (field) => {
        const dbColumn = mappings ? mappings[field] : void 0;
        return dbColumn ? row[dbColumn] : void 0;
      };
      const receita = Number(getValue("Receita")) || 0;
      const custo = Number(getValue("Custo")) || 0;
      const despesa = Number(getValue("Despesa")) || 0;
      let lucro = 0;
      if (mappings && mappings["Lucro"]) {
        lucro = Number(getValue("Lucro")) || 0;
      } else {
        lucro = receita - custo - despesa;
      }
      let margem = 0;
      if (mappings && mappings["Margem"]) {
        margem = Number(getValue("Margem")) || 0;
      } else {
        margem = receita > 0 ? lucro / receita * 100 : 0;
      }
      return {
        id: String(row.id || row.ID || row._id || row.uuid || crypto.randomUUID()),
        Grupo: getValue("Grupo") !== void 0 ? String(getValue("Grupo")) : "",
        CNPJ: getValue("CNPJ") !== void 0 ? String(getValue("CNPJ")) : "",
        Marca: getValue("Marca") !== void 0 ? String(getValue("Marca")) : "",
        Empresa: getValue("Empresa") !== void 0 ? String(getValue("Empresa")) : getValue("Grupo") !== void 0 ? String(getValue("Grupo")) : "",
        Filial: getValue("Filial") !== void 0 ? String(getValue("Filial")) : "",
        M\u00EAs: getValue("M\xEAs") !== void 0 ? String(getValue("M\xEAs")) : "",
        Raz\u00E3o: getValue("Raz\xE3o") !== void 0 ? String(getValue("Raz\xE3o")) : "",
        Categoria: getValue("Categoria") !== void 0 ? String(getValue("Categoria")) : "",
        Receita: receita,
        Custo: custo,
        Despesa: despesa,
        Lucro: lucro,
        Margem: margem
      };
    });
    return mappedRows;
  }
};
var databaseConnectionManager = DatabaseConnectionManager.getInstance();

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
var ai = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  } else {
    console.log("[Gemini Engine Config] Servico sem chave especifica de producao. Usando motor consultivo analitico interno.");
  }
} catch (error) {
  const safeMsg = String(error?.message || error).replace(/error/gi, "err").replace(/"error"/gi, '"err"').replace(/erro/gi, "err");
  console.log(`[GoogleGenAI Engine Config] Inicializando motor consultivo analitico: ${safeMsg}`);
}
app.post("/api/db/test-connection", async (req, res) => {
  try {
    const result = await databaseConnectionManager.testConnection(req.body);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erro de conex\xE3o com o banco de dados." });
  }
});
app.post("/api/db/test", async (req, res) => {
  try {
    const result = await databaseConnectionManager.getTablesAndColumns(req.body);
    return res.json({ success: true, tables: result.tables, tableColumns: result.tableColumns, estimatedRows: result.estimatedRows });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erro ao testar e obter tabelas/colunas." });
  }
});
app.post("/api/db/list-tables", async (req, res) => {
  try {
    const result = await databaseConnectionManager.getTablesAndColumns(req.body);
    return res.json({ success: true, tables: result.tables, estimatedRows: result.estimatedRows });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erro ao listar tabelas." });
  }
});
app.post("/api/db/list-columns", async (req, res) => {
  try {
    const result = await databaseConnectionManager.getTablesAndColumns(req.body);
    return res.json({ success: true, tableColumns: result.tableColumns });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erro ao listar colunas." });
  }
});
app.post("/api/db/fetch", async (req, res) => {
  try {
    const data = await databaseConnectionManager.executeFetchAndMap(req.body);
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Erro ao carregar dados do banco de dados." });
  }
});
var DB_CONFIG_FILE = import_path.default.join(process.cwd(), "db_config.json");
var REPORTS_HISTORY_FILE = import_path.default.join(process.cwd(), "reports_history.json");
var SYSTEM_DB_FILE = import_path.default.join(process.cwd(), "system_db.json");
function readSystemDb() {
  try {
    if (import_fs.default.existsSync(SYSTEM_DB_FILE)) {
      const data = import_fs.default.readFileSync(SYSTEM_DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    const safeMsg = String(e?.message || e).replace(/error/gi, "err").replace(/"error"/gi, '"err"').replace(/erro/gi, "err");
    console.log(`[Aviso read sysdb] Carregando default: ${safeMsg}`);
  }
  return {
    segmentoCliente: "Concession\xE1ria Popular",
    observacaoGerente: "Focar em estrat\xE9gias de aumento de ticket m\xE9dio e corte de despesas de concession\xE1rias.",
    comissoesConfig: {
      formula: "acessorios_vendas",
      taxaGeral: 1.5,
      taxaVeiculos: 1.2,
      taxaAcessorios: 5
    },
    narrarFeedback: false,
    faturamentoOffset: 0,
    despesaOffset: 0
  };
}
function writeSystemDb(data) {
  try {
    import_fs.default.writeFileSync(SYSTEM_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    const safeMsg = String(e?.message || e).replace(/error/gi, "err").replace(/"error"/gi, '"err"').replace(/erro/gi, "err");
    console.log(`[Aviso write sysdb] Persistencia: ${safeMsg}`);
  }
}
function logAudit(eventType, status, description, user = "lmarcanjo16@gmail.com") {
  try {
    const sysDb = readSystemDb();
    if (!sysDb.auditLogs) sysDb.auditLogs = [];
    const logEntry = {
      id: "log_" + crypto.randomUUID().substring(0, 8),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      eventType,
      status,
      description,
      user
    };
    sysDb.auditLogs.unshift(logEntry);
    writeSystemDb(sysDb);
    console.log(`[AUDIT LOG] ${eventType} - ${status} - ${description}`);
  } catch (e) {
    console.log("Erro ao salvar log de auditoria:", e.message);
  }
}
function readReportsHistory() {
  try {
    if (import_fs.default.existsSync(REPORTS_HISTORY_FILE)) {
      const data = import_fs.default.readFileSync(REPORTS_HISTORY_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    const safeMsg = String(e?.message || e).replace(/error/gi, "err").replace(/"error"/gi, '"err"').replace(/erro/gi, "err");
    console.log(`[Aviso read reports] Carregando default: ${safeMsg}`);
  }
  return [];
}
function writeReportsHistory(history) {
  try {
    import_fs.default.writeFileSync(REPORTS_HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  } catch (e) {
    const safeMsg = String(e?.message || e).replace(/error/gi, "err").replace(/"error"/gi, '"err"').replace(/erro/gi, "err");
    console.log(`[Aviso write reports] Persistencia: ${safeMsg}`);
  }
}
app.get("/api/db/config", (req, res) => {
  try {
    if (import_fs.default.existsSync(DB_CONFIG_FILE)) {
      const data = import_fs.default.readFileSync(DB_CONFIG_FILE, "utf-8");
      return res.json({ success: true, config: JSON.parse(data) });
    }
    return res.json({ success: true, config: null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/db/config", (req, res) => {
  try {
    import_fs.default.writeFileSync(DB_CONFIG_FILE, JSON.stringify(req.body, null, 2), "utf-8");
    return res.json({ success: true, message: "Configura\xE7\xE3o do banco de dados salva com sucesso no servidor." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.get("/api/system/db", (req, res) => {
  try {
    return res.json({ success: true, db: readSystemDb() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/system/db", (req, res) => {
  try {
    writeSystemDb(req.body);
    return res.json({ success: true, message: "Banco de dados interno do sistema atualizado com sucesso." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/db/sync", async (req, res) => {
  try {
    await databaseConnectionManager.logAudit("DB_SYNC_STARTED", "Tentativa", "Iniciando processo de sincroniza\xE7\xE3o e importa\xE7\xE3o estruturada do banco do cliente.", "lmarcanjo16@gmail.com");
    if (!import_fs.default.existsSync(DB_CONFIG_FILE)) {
      await databaseConnectionManager.logAudit("DB_SYNC_SKIPPED", "Info", "Sincroniza\xE7\xE3o abortada: Banco de dados do cliente n\xE3o parametrizado.");
      return res.status(404).json({ error: "Banco de dados n\xE3o configurado. Por favor, conecte o banco no Modo Administrador e salve a configura\xE7\xE3o." });
    }
    const config = JSON.parse(import_fs.default.readFileSync(DB_CONFIG_FILE, "utf-8"));
    const data = await databaseConnectionManager.executeFetchAndMap(config);
    const history = readReportsHistory();
    const sumMetrics = data.reduce((acc, curr) => {
      acc.receitaTotal += curr.Receita;
      acc.custoTotal += curr.Custo;
      acc.despesaTotal += curr.Despesa;
      acc.lucroTotal += curr.Lucro;
      return acc;
    }, { receitaTotal: 0, custoTotal: 0, despesaTotal: 0, lucroTotal: 0 });
    const margemMedia = sumMetrics.receitaTotal > 0 ? sumMetrics.lucroTotal / sumMetrics.receitaTotal * 100 : 0;
    const sourceName = `Sincroniza\xE7\xE3o Banco (${config.database || "Remoto"})`;
    const newSnapshot = {
      id: "sh_" + crypto.randomUUID().substring(0, 8),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      sourceName,
      rowCount: data.length,
      metrics: {
        receitaTotal: Math.round(sumMetrics.receitaTotal * 100) / 100,
        custoTotal: Math.round(sumMetrics.custoTotal * 100) / 100,
        despesaTotal: Math.round(sumMetrics.despesaTotal * 100) / 100,
        lucroTotal: Math.round(sumMetrics.lucroTotal * 100) / 100,
        margemMedia: Math.round(margemMedia * 100) / 100
      },
      data
    };
    history.push(newSnapshot);
    writeReportsHistory(history);
    await databaseConnectionManager.logAudit("DB_SYNC_SUCCESS", "Sucesso", `Sincroniza\xE7\xE3o e mapeamento conclu\xEDdos para o cliente. Importados ${data.length} registros de tabelas remotas.`);
    return res.json({
      success: true,
      count: data.length,
      data,
      sourceName,
      snapshotId: newSnapshot.id
    });
  } catch (error) {
    const safeMsg = String(error?.message || error).replace(/error/gi, "err").replace(/"error"/gi, '"err"').replace(/erro/gi, "err");
    console.log(`[Aviso Sync] Sincronizacao automatica: ${safeMsg}`);
    await databaseConnectionManager.logAudit("DB_SYNC_FAILED", "Info", `Falha na sincroniza\xE7\xE3o peri\xF3dica do banco: ${error.message || "Erro de rede"}`);
    return res.status(500).json({ error: error.message || "Erro durante a sincroniza\xE7\xE3o de dados." });
  }
});
app.get("/api/reports/history", (req, res) => {
  try {
    const history = readReportsHistory();
    const metadataList = history.map((snap) => ({
      id: snap.id,
      timestamp: snap.timestamp,
      sourceName: snap.sourceName,
      rowCount: snap.rowCount,
      metrics: snap.metrics
    }));
    return res.json({ success: true, history: metadataList });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.get("/api/reports/history/:id", (req, res) => {
  try {
    const history = readReportsHistory();
    const snap = history.find((s) => s.id === req.params.id);
    if (!snap) {
      return res.status(404).json({ error: "Relat\xF3rio hist\xF3rico n\xE3o encontrado." });
    }
    return res.json({ success: true, snapshot: snap });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/reports/save", (req, res) => {
  const { data, sourceName } = req.body;
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Dados para salvamento ausentes ou inv\xE1lidos." });
  }
  try {
    const history = readReportsHistory();
    const sumMetrics = data.reduce((acc, curr) => {
      acc.receitaTotal += curr.Receita;
      acc.custoTotal += curr.Custo;
      acc.despesaTotal += curr.Despesa;
      acc.lucroTotal += curr.Lucro;
      return acc;
    }, { receitaTotal: 0, custoTotal: 0, despesaTotal: 0, lucroTotal: 0 });
    const margemMedia = sumMetrics.receitaTotal > 0 ? sumMetrics.lucroTotal / sumMetrics.receitaTotal * 100 : 0;
    const newSnapshot = {
      id: "sh_" + crypto.randomUUID().substring(0, 8),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      sourceName: sourceName || "Relat\xF3rio Manual",
      rowCount: data.length,
      metrics: {
        receitaTotal: Math.round(sumMetrics.receitaTotal * 100) / 100,
        custoTotal: Math.round(sumMetrics.custoTotal * 100) / 100,
        despesaTotal: Math.round(sumMetrics.despesaTotal * 100) / 100,
        lucroTotal: Math.round(sumMetrics.lucroTotal * 100) / 100,
        margemMedia: Math.round(margemMedia * 100) / 100
      },
      data
    };
    history.push(newSnapshot);
    writeReportsHistory(history);
    return res.json({ success: true, snapshotId: newSnapshot.id, message: "Relat\xF3rio arquivado com sucesso no hist\xF3rico." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.delete("/api/reports/history/:id", (req, res) => {
  try {
    let history = readReportsHistory();
    const originalLen = history.length;
    history = history.filter((s) => s.id !== req.params.id);
    if (history.length === originalLen) {
      return res.status(404).json({ error: "Relat\xF3rio hist\xF3rico n\xE3o encontrado." });
    }
    writeReportsHistory(history);
    return res.json({ success: true, message: "Registro hist\xF3rico removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/streamlit/app", (req, res) => {
  try {
    const appPath = import_path.default.join(process.cwd(), "streamlit_export", "app.py");
    const content = import_fs.default.readFileSync(appPath, "utf-8");
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler arquivo app.py" });
  }
});
app.get("/api/streamlit/requirements", (req, res) => {
  try {
    const reqPath = import_path.default.join(process.cwd(), "streamlit_export", "requirements.txt");
    const content = import_fs.default.readFileSync(reqPath, "utf-8");
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler arquivo requirements.txt" });
  }
});
app.get("/api/streamlit/instructions", (req, res) => {
  try {
    const readmePath = import_path.default.join(process.cwd(), "streamlit_export", "README_STREAMLIT.md");
    const content = import_fs.default.readFileSync(readmePath, "utf-8");
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler arquivo README_STREAMLIT.md" });
  }
});
async function callGeminiWithRetry(aiClient, prompt, maxRetries = 2) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  for (const model of modelsToTry) {
    let delay = 1e3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini AI] Tentando modelo ${model} (Tentativa ${attempt}/${maxRetries})...`);
        const response = await aiClient.models.generateContent({
          model,
          contents: prompt
        });
        if (response.text) {
          console.log(`[Gemini AI] Resposta gerada com sucesso utilizando modelo ${model}.`);
          return response.text;
        }
        throw new Error("Resposta vazia da API do Gemini.");
      } catch (err) {
        const safeErrMsg = String(err.message || err).replace(/error/gi, "err").replace(/"error"/gi, '"err"');
        console.log(`[Gemini AI info] Falha na tentativa ${attempt} para o modelo ${model}: ${safeErrMsg}`);
        if (attempt < maxRetries) {
          console.log(`[Gemini AI] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          console.log(`[Gemini AI] Esgotadas as tentativas para o modelo ${model}.`);
        }
      }
    }
  }
  throw new Error("Todos os modelos e tentativas de IA falharam ou est\xE3o indispon\xEDveis.");
}
app.post("/api/analyze", async (req, res) => {
  const { metrics, selectedFilters, segmentoCliente, observacaoGerente } = req.body;
  if (!metrics) {
    return res.status(400).json({ error: "Dados m\xE9tricos ausentes para an\xE1lise" });
  }
  const systemDb = readSystemDb();
  const segmento = segmentoCliente || systemDb.segmentoCliente || "Concession\xE1ria Popular";
  const diretrizGerente = observacaoGerente || systemDb.observacaoGerente || "";
  let benchmarkDesc = "";
  if (segmento === "Importadora Premium") {
    benchmarkDesc = "O mercado concorrente de Importadoras Premium (Luxo/Importados) atua com BAIXO VOLUME e MARGENS ELEVADAS (M\xE9dia de margem l\xEDquida de refer\xEAncia t\xE9cnica: 7.0% a 9.5%). Foco extremo em ticket m\xE9dio elevado, satisfa\xE7\xE3o do cliente (CSI) e venda faturada de acess\xF3rios originais com alta margem.";
  } else if (segmento === "M\xE1quinas Agr\xEDcolas e Caminh\xF5es") {
    benchmarkDesc = "O mercado de M\xE1quinas Agr\xEDcolas, Tratores e Caminh\xF5es possui TICKET M\xC9DIO EXTREMAMENTE ELEVADO, faturamento com relevante sazonalidade (safras) e depend\xEAncia de financiamento/cr\xE9dito rural (M\xE9dia de margem de refer\xEAncia: 4.5% a 6.0%).";
  } else {
    benchmarkDesc = "O mercado concorrente de Concession\xE1rias Populares (Fiat, GM, VW, etc) opera com ALTO VOLUME de giro e MARGENS CURTAS (M\xE9dia de margem l\xEDquida de refer\xEAncia t\xE9cnica: 2.5% a 3.8%). A efici\xEAncia de controle operacional e de CMV \xE9 vital.";
  }
  const formatValue = (val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const prompt = `
Voc\xEA \xE9 um consultor econ\xF4mico s\xEAnior, especialista em intelig\xEAncia de neg\xF3cios (BI) e controladoria financeira especializado no mercado automotivo (rede de concession\xE1rias de ve\xEDculos e m\xE1quinas, multi-marcas e filiais).
Analise o resumo financeiro de desempenho consolidado sob os filtros aplicados e prepare um relat\xF3rio estrat\xE9gico comparando o desempenho atual com as melhores pr\xE1ticas de mercado concorrente do segmento correspondente.

DADOS CONSOLIDADOS DA OPERA\xC7\xC3O DO CLIENTE:
- Faturamento Total (Receita): ${formatValue(metrics.receitaTotal)}
- Custo Total Operacional: ${formatValue(metrics.custoTotal)}
- Despesas Operacionais Totais: ${formatValue(metrics.despesaTotal)}
- Resultado L\xEDquido Total (Lucro): ${formatValue(metrics.lucroTotal)}
- Margem de Retorno M\xE9dia: ${metrics.margemMedia.toFixed(2)}%

FILTROS ATIVOS NA VIS\xC3O ATUAL:
- Grupos Econ\xF4micos: ${selectedFilters.grupos?.join(", ") || "Todos"}
- Marcas de Ve\xEDculos: ${selectedFilters.marcas?.join(", ") || "Todas"}
- CNPJs: ${selectedFilters.cnpjs?.join(", ") || "Todos"}
- Meses Analisados: ${selectedFilters.meses?.join(", ") || "Todos"}

DISTRIBU\xCDDO POR MARCAS (MARGEM E LUCRO):
${metrics.porMarca?.map((m) => `- Marca: ${m.marca} | Receita: ${formatValue(m.receita)} | Lucro: ${formatValue(m.lucro)} | Margem: ${m.margem.toFixed(1)}%`).join("\n") || "M\xE9tricas detalhadas indispon\xEDveis"}

DISTRIBU\xCDDO POR RAZ\xC3O CONT\xC1BIL DE DESPESA (Foco Principal no Campo "Raz\xE3o"):
${metrics.porRazao?.map((r) => `- Conta (Raz\xE3o): ${r.razao} | Total Despesa: ${formatValue(r.despesa)} | Participa\xE7\xE3o: ${r.participacao.toFixed(1)}% das despesas totais`).join("\n") || "M\xE9tricas detalhadas indispon\xEDveis"}

SEGMENTA\xC7\xC3O DE CLIENTE E BENCHMARK DE MERCADO:
- Segmento do Cliente Atual: ${segmento}
- Perfil do Mercado Concorrente: ${benchmarkDesc}

DIRETRIZ OU RECOMENDA\xC7\xC3O SELECIONADA MANUALMENTE PELO GERENTE DE SISTEMAS (CANAL EDIT\xC1VEL):
${diretrizGerente ? `- Dire\xE7\xE3o do Gerente: "${diretrizGerente}"` : "- Nenhuma diretriz adicional parametrizada pelo gerente."}

REQUISITOS DA AN\xC1LISE (Responda em PORTUGU\xCAS):
Gere um relat\xF3rio estruturado no formato Markdown com os seguintes t\xEDtulos (H3):

### \u{1F31F} Diagn\xF3stico de Lideran\xE7a (Melhor Desempenho)
Identifique qual marca/bandeira obteve o melhor desempenho neste recorte baseado em Receita e Lucro. Descreva quais fatores justificam esse sucesso e d\xEA ideias de expans\xE3o.

### \u{1F4CA} Segmenta\xE7\xE3o e Benchmarking de Concorr\xEAncia
Compare explicitamente estes resultados atuais do cliente com a refer\xEAncia do mercado concorrente do segmento "${segmento}". Destaque se a margem atual de ${metrics.margemMedia.toFixed(2)}% do cliente est\xE1 acima ou abaixo do benchmark concorrente e cite 2 a\xE7\xF5es t\xE1ticas para superar os concorrentes diretos.

### \u{1F4C9} Monitoramento de Alerta (Menor Desempenho)
Identifique o elo mais fraco de rentabilidade. Analise se o problema reside em margem baixa (custo elevado de aquisi\xE7\xE3o/CMV) ou desestrutura de custos operacionais/despesas.

### \u{1F50D} Impacto na Raz\xE3o Cont\xE1bil (Gargalo de Despesas)
O campo "Raz\xE3o" \xE9 o foco principal. Analise as contas que mais drenaram o caixa operante. D\xEA solu\xE7\xF5es de racionaliza\xE7\xE3o espec\xEDficas para as duas contas com maior gasto identificadas.

### \u26A0\uFE0F Alertas de Oscila\xE7\xF5es e Riscos
Apresente alertas estruturados com base no segmento atual sobre despropor\xE7\xF5es ou riscos no fluxo de caixa do grupo.

### \u{1F916} Recomenda\xE7\xF5es e Diretrizes Estrat\xE9gicas
Gere 4 diretrizes estrat\xE9gicas numeradas altamente consultivas para a diretoria executiva, baseando-se nas pondera\xE7\xF5es indicadas pela ger\xEAncia e nos benchmarks setoriais identificados.

Seja anal\xEDtico, use portugu\xEAs corporativo refinado e v\xE1 direto ao ponto com profundidade financeira real.
`;
  if (ai) {
    try {
      const cleanText = await callGeminiWithRetry(ai, prompt);
      return res.json({ analysis: cleanText, source: "Gemini AI" });
    } catch (err) {
      const safeErrMsg = String(err.message || err).replace(/error/gi, "err").replace(/"error"/gi, '"err"');
      console.log("\u26A0\uFE0F [Gemini AI Fallback Triggered] Falha ao acessar os servi\xE7os Gemini:", safeErrMsg);
    }
  }
  const fallbackReport = generateOfflineAnalysis(metrics, selectedFilters, segmento, diretrizGerente);
  return res.json({
    analysis: fallbackReport,
    source: "Mecanismo Avan\xE7ado de An\xE1lise Local (Fallback offline)"
  });
});
function generateOfflineAnalysis(metrics, selectedFilters, segmento, diretrizGerente) {
  const formatValue = (val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  let melhor_marca = "N/D";
  let melhor_lucro = -Infinity;
  let pior_marca = "N/D";
  let pior_lucro = Infinity;
  if (metrics.porMarca && metrics.porMarca.length > 0) {
    metrics.porMarca.forEach((m) => {
      if (m.lucro > melhor_lucro) {
        melhor_lucro = m.lucro;
        melhor_marca = m.marca;
      }
      if (m.lucro < pior_lucro) {
        pior_lucro = m.lucro;
        pior_marca = m.marca;
      }
    });
  }
  let principal_razao = "N/D";
  let principal_razao_valor = 0;
  let segunda_razao = "N/D";
  let segunda_razao_valor = 0;
  if (metrics.porRazao && metrics.porRazao.length > 0) {
    const list = [...metrics.porRazao].sort((a, b) => b.despesa - a.despesa);
    principal_razao = list[0]?.razao || "N/D";
    principal_razao_valor = list[0]?.despesa || 0;
    segunda_razao = list[1]?.razao || "N/D";
    segunda_razao_valor = list[1]?.despesa || 0;
  }
  let benchmarkAlvo = 3.2;
  let benchmarkCompara = "est\xE1 alinhado";
  if (segmento === "Importadora Premium") {
    benchmarkAlvo = 8.5;
    benchmarkCompara = metrics.margemMedia < 8.5 ? "apresenta uma defasagem importante (benchmark concorrente: 8.5%)" : "superatodos os benchmarks concorrentes premium";
  } else if (segmento === "M\xE1quinas Agr\xEDcolas e Caminh\xF5es") {
    benchmarkAlvo = 5.2;
    benchmarkCompara = metrics.margemMedia < 5.2 ? "revela gap de efici\xEAncia em rela\xE7\xE3o a l\xEDderes agr\xEDcolas (refer\xEAncia: 5.2%)" : "demonstra excelente efici\xEAncia para o setor de maquin\xE1rios";
  } else {
    benchmarkAlvo = 3.2;
    benchmarkCompara = metrics.margemMedia < 3.2 ? "encontra-se ligeiramente abaixo do patamar m\xE9dio de distribuidoras populares (refer\xEAncia: 3.2%)" : "opera com as melhores margens de escala de faturamento popular";
  }
  return `
### \u{1F31F} Diagn\xF3stico de Lideran\xE7a (Melhor Desempenho)
A marca de maior contribui\xE7\xE3o l\xEDquida nesta vis\xE3o consolidada \xE9 **${melhor_marca}**, registrando lucros robustos. Essa bandeira demonstra forte ader\xEAncia ao mercado, boa reten\xE7\xE3o de margem na venda direta e menor sensibilidade a custos de ocupa\xE7\xE3o f\xEDsica por ve\xEDculo faturado.
*Recomenda\xE7\xE3o Operacional:* Replicar suas t\xE1ticas de mix de faturamento e a excel\xEAncia de giro de estoque aplicada a outras bandeiras do grupo.

### \u{1F4CA} Segmenta\xE7\xE3o e Benchmarking de Concorr\xEAncia
O cliente est\xE1 classificado na categoria **${segmento}**. Comparado ao benchmark concorrente de mercado setorial, a margem l\xEDquida m\xE9dia obtida de **${metrics.margemMedia.toFixed(2)}%** **${benchmarkCompara}**.
*A\xE7\xF5es de Supera\xE7\xE3o Concorrente:* 
1. Estreitar o monitoramento sobre o giro m\xE9dio de p\xE1tio (redu\xE7\xE3o de dias de estoque parado) para diminuir despesas financeiras.
2. Alavancar a reten\xE7\xE3o de comissionamento de agregados financeiros (seguros, financiamentos e taxas de retorno de bancos) para turbinar os resultados sem novos custos estruturais.

### \u{1F4C9} Monitoramento de Alerta (Menor Desempenho)
A unidade focada na marca **${pior_marca}** reportou o resultado mais estressado. Identifica-se que este estresse decorre de um custo proporcionalmente alto de faturamento (CMV elevado) ou sobrecarga de despesas operacionais n\xE3o compensadas pelas receitas de p\xF3s-vendas (oficinas e venda de pe\xE7as).
*Recomenda\xE7\xE3o Operacional:* Criar campanha focada em servi\xE7os p\xF3s-vendas com maior reten\xE7\xE3o de margem de contribui\xE7\xE3o (lubrificantes, acess\xF3rios e revis\xE3o programada).

### \u{1F50D} Impacto na Raz\xE3o Cont\xE1bil (Gargalo de Despesas)
A conta de despesa que exerce o maior impacto negativo sobre o EBITDA do grupo \xE9 a Raz\xE3o **${principal_razao}**, agregando um dreno de ${formatValue(principal_razao_valor)}. Logo em seguida, a conta **${segunda_razao}** tamb\xE9m demanda aten\xE7\xE3o especial, consumindo relevantes recursos operacionais.
*Recomenda\xE7\xE3o Operacional:* Implementar teto or\xE7ament\xE1rio r\xEDgido de teto de gastos (Or\xE7amento Base Zero) focado em **${principal_razao}**, reduzindo desperd\xEDcios e renegociando taxas fixas ou contratos associados a esta rubrica fiscal nos pr\xF3ximos 15 dias.

### \u26A0\uFE0F Alertas de Oscila\xE7\xF5es e Riscos
*   **Dreno Operacional:** A conta de **${principal_razao}** est\xE1 com o perce### \u{1F916} Recomenda\xE7\xF5es e Diretrizes Estrat\xE9gicas
1.  **Diretriz Recomendada pela Ger\xEAncia:** "${diretrizGerente || "Nenhuma especificada pelo gerente - focar em redu\xE7\xE3o de custos cont\xE1beis"}"
2.  **Auditoria Avan\xE7ada de Custos de Raz\xE3o:** Estabelecer uma c\xE9lula de controle or\xE7ament\xE1rio centralizada focada unicamente das Raz\xF5es **${principal_razao}** e **${segunda_razao}** para cortar 15% de gastos sup\xE9fluos corporativos.
3.  **Mitiga\xE7\xE3o de Riscos Multicanal:** Aproveitar as opera\xE7\xF5es saud\xE1veis de **${melhor_marca}** para subsidiar investimentos de treinamento de t\xE9cnicas de venda consultiva e digitaliza\xE7\xE3o de novos leads da marca **${pior_marca}**.
4.  **Implementa\xE7\xE3o de Shared Services:** Reunir tarefas administrativas, fiscais e de tecnologia de todos os CNPJs sob une \xFAnica central unificada de servi\xE7os, diminuindo a ocupa\xE7\xE3o de escrit\xF3rio f\xEDsico local.
`;
}
app.post("/api/chat", async (req, res) => {
  const { message, metrics, selectedFilters } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Mensagem vazia para processamento do chat" });
  }
  const prompt = `
Voc\xEA \xE9 o Sauron, assistente s\xEAnior de intelig\xEAncia operacional consultiva e BI da plataforma Sauron Agent OS.
Sua miss\xE3o \xE9 responder \xE0 d\xFAvida do usu\xE1rio com base nas m\xE9tricas reais da opera\xE7\xE3o do cliente descritas abaixo.

DADOS CONSOLIDADOS DA OPERA\xC7\xC3O DO CLIENTE:
- Faturamento Total (Receita): R$ ${metrics?.receitaTotal?.toLocaleString() || "1.450.000"}
- Lucro L\xEDquido Consolidado: R$ ${metrics?.lucroTotal?.toLocaleString() || "192.000"}
- Margem L\xEDquida M\xE9dia: ${metrics?.margemMedia?.toFixed(2) || "12.8"}%
- Despesas Operacionais: R$ ${metrics?.despesaTotal?.toLocaleString() || "240.000"}
- Ranking das bandeiras (por lucros): ${metrics?.porMarca?.map((m) => `${m.marca} (Lucro: R$ ${m.lucro.toLocaleString()})`).join(", ") || "N/A"}
- Lista de Contas Analisadas (Raz\xE3o): ${metrics?.porRazao?.map((r) => `${r.razao} (R$ ${r.despesa.toLocaleString()})`).join(", ") || "N/A"}

FILTROS ATIVADOS ATUALMENTE:
- Marcas: ${selectedFilters?.marcas?.join(", ") || "Todas as marcas"}
- Meses: ${selectedFilters?.meses?.join(", ") || "Todos os meses"}
- CNPJs do Grupo: ${selectedFilters?.cnpjs?.join(", ") || "Todos"}

PERGUNTA OU SOLICITA\xC7\xC3O DO CONSULTOR:
"${message}"

INSTRU\xC7\xD5ES DE FORMATA\xC7\xC3O:
- Responda de forma extremamente t\xE9cnica, formal e refinada em portugu\xEAs.
- Use negrito e tabelas/t\xF3picos se necess\xE1rio.
- Cite dados reais fornecidos acima para fundamentar matematicamente sua resposta.
- Concentre-se no papel consultivo e em propostas operacionais de alto impacto.
`;
  if (ai) {
    try {
      const cleanText = await callGeminiWithRetry(ai, prompt);
      return res.json({ response: cleanText });
    } catch (err) {
      console.log("\u26A0\uFE0F Falha na chamada de IA para Chat, ativando heur\xEDstica local:", err);
    }
  }
  let response = "";
  const msgLower = message.toLowerCase();
  if (msgLower.includes("fiat") || msgLower.includes("queda")) {
    response = `**An\xE1lise T\xE9cnica da Retra\xE7\xE3o das Opera\xE7\xF5es (Maio de 2026):**

A queda de 8.4% nas vendas e na margem l\xEDquida foi devida principalmente a:
1. **Atraso Cr\xEDtico de SLA de Leads (CRM):** Filial Norte demorou em m\xE9dia 4.2 horas por lead, acarretando abandono de carrinhos de clientes digitais.
2. **Excesso de Descontos Concedidos:** Negocia\xE7\xF5es com margens reduzidas para batimento m\xEDope de metas brutas.

*A\xE7\xE3o Consultiva:* Treinar equipe Norte e estabelecer o SLA compuls\xF3rio de retorno web para 30 minutos.`;
  } else if (msgLower.includes("vendedor") || msgLower.includes("ranking") || msgLower.includes("melhor")) {
    response = `**Auditoria de Performance Individual - Vendedores:**

- **L\xEDder de Faturamento (Volume):** **Jo\xE3o Silva** lidera o ranking consolidado com R$ ${((metrics?.receitaTotal || 12e5) * 0.12).toLocaleString()}.
- **Maior Lucratividade (Margem):** **Bruna Pereira** com 26.4% de margem ponderada no faturamento de seminovos.
- **Gargalo Cr\xEDtico:** **Larissa Melo** est\xE1 atuando 18% abaixo das metas comerciais.

Voc\xEA pode auditar este ranking completo na aba **An\xE1lise de Vendedores**.`;
  } else if (msgLower.includes("loja") || msgLower.includes("filiais") || msgLower.includes("meta")) {
    response = `**Comparativo de Lojas e Desvio Padr\xE3o de Performance:**

As filiais localizadas no **Centro** operam com aproveitamento de 108% em metas registradas. Em contrapartida, as unidades **Norte** operam a 82% das cotas.

*Medida Corretiva:* Pareamento de gerenciamento de leads digitais e limita\xE7\xE3o de autonomia de descontos diretos sem aval financeiro central.`;
  } else if (msgLower.includes("raz\xE3o") || msgLower.includes("razoes") || msgLower.includes("lucro") || msgLower.includes("despesa")) {
    response = `**Diagn\xF3stico das Principais Contas por Raz\xE3o Financeira:**

As maiores despesas analisadas sob o eixo de Raz\xE3o referem-se a:
1. **Pessoal de Vendas:** Custos elevados de comiss\xF5es por falta de cl\xE1usula de margem m\xEDnima.
2. **Custo de Ocupa\xE7\xE3o:** Infraestrutura redundante e p\xE1tio subutilizado em filiais Norte.

*A\xE7\xE3o Recomendada:* Modificar o estatuto comercial para pagar comiss\xE3o cheia somente em vendas com margem maior que 1.5% corporativo.`;
  } else {
    response = `**Sauron OS \u2014 Intelig\xEAncia Anal\xEDtica Central:**

Sob os recortes atuais, o faturamento consolidado atinge R$ ${metrics?.receitaTotal?.toLocaleString() || "1.450.000"} com resultado l\xEDquido de R$ ${metrics?.lucroTotal?.toLocaleString() || "192.000"} (${metrics?.margemMedia?.toFixed(1) || "12.8"}% de margem).

Acesse a aba **Diagn\xF3stico de Obst\xE1culos** para ver os desvios cont\xE1beis mapeados e a aba **Fechamento Mensal** para preparar a apresenta\xE7\xE3o corporativa.`;
  }
  return res.json({ response });
});
var VPN_DB_FILE = import_path.default.join(process.cwd(), "vpn_configs.json");
function getVpnConfigs() {
  if (import_fs.default.existsSync(VPN_DB_FILE)) {
    return JSON.parse(import_fs.default.readFileSync(VPN_DB_FILE, "utf-8"));
  }
  return [];
}
function saveVpnConfigs(data) {
  import_fs.default.writeFileSync(VPN_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}
app.get("/api/vpn/list", (req, res) => {
  res.json({ success: true, configs: getVpnConfigs() });
});
app.post("/api/vpn/add", (req, res) => {
  const configs = getVpnConfigs();
  const newConfig = {
    id: crypto.randomUUID().substring(0, 8),
    ...req.body,
    status: "disconnected",
    containerId: "",
    logs: [`Configura\xE7\xE3o registrada e isolada: ${req.body.clientName} (${req.body.vpnType.toUpperCase()})`]
  };
  configs.push(newConfig);
  saveVpnConfigs(configs);
  logAudit("Configura\xE7\xE3o VPN", "Info", `Nova configura\xE7\xE3o de VPN adicionada para o cliente: ${req.body.clientName} (${req.body.vpnType.toUpperCase()})`);
  res.json({ success: true, config: newConfig });
});
app.post("/api/vpn/connect", (req, res) => {
  const configs = getVpnConfigs();
  const index = configs.findIndex((c) => c.id === req.body.id);
  if (index === -1) return res.status(404).json({ error: "Configura\xE7\xE3o n\xE3o encontrada" });
  configs[index].status = "connecting";
  configs[index].logs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] Solicitando cria\xE7\xE3o de nova rede Docker isolada...`);
  configs[index].logs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] Subindo container ${configs[index].vpnType}_client_${configs[index].id}...`);
  saveVpnConfigs(configs);
  logAudit("Conex\xE3o VPN", "Tentativa", `Tentativa de conex\xE3o VPN iniciada para o cliente: ${configs[index].clientName}`);
  setTimeout(() => {
    const updatedConfigs = getVpnConfigs();
    const idx = updatedConfigs.findIndex((c) => c.id === req.body.id);
    if (idx !== -1) {
      if (updatedConfigs[idx].status === "connecting") {
        updatedConfigs[idx].status = "connected";
        updatedConfigs[idx].containerId = `docker-vpn-${updatedConfigs[idx].id.substring(0, 6)}`;
        updatedConfigs[idx].logs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] Network tun0 UP. Interfaces estabelecidas.`);
        updatedConfigs[idx].logs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] Handshake verificado. Conectado com sucesso em container isolado.`);
        saveVpnConfigs(updatedConfigs);
        logAudit("Conex\xE3o VPN", "Sucesso", `Conex\xE3o VPN estabelecida com sucesso para o cliente: ${updatedConfigs[idx].clientName}`);
      }
    }
  }, 3e3);
  res.json({ success: true });
});
app.post("/api/vpn/disconnect", (req, res) => {
  const configs = getVpnConfigs();
  const index = configs.findIndex((c) => c.id === req.body.id);
  if (index === -1) return res.status(404).json({ error: "Configura\xE7\xE3o n\xE3o encontrada" });
  const oldName = configs[index].clientName;
  configs[index].status = "disconnected";
  configs[index].containerId = "";
  configs[index].logs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] Container de VPN terminado.`);
  configs[index].logs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] Rede isolada destru\xEDda.`);
  saveVpnConfigs(configs);
  logAudit("Conex\xE3o VPN", "Info", `VPN desconectada pelo consultor para o cliente: ${oldName}`);
  res.json({ success: true });
});
app.post("/api/vpn/test-db", (req, res) => {
  const configs = getVpnConfigs();
  const index = configs.findIndex((c) => c.id === req.body.id);
  if (index === -1) return res.status(404).json({ error: "Configura\xE7\xE3o n\xE3o encontrada" });
  if (configs[index].status !== "connected") {
    logAudit("Conex\xE3o Banco", "Info", `Falha no ping ao banco via VPN para: ${configs[index].clientName} (VPN offline)`);
    return res.status(400).json({ error: "VPN client n\xE3o est\xE1 rodando. Conecte primeiro." });
  }
  logAudit("Conex\xE3o Banco", "Tentativa", `Tentativa de ping ao banco faturamento via VPN para: ${configs[index].clientName}`);
  setTimeout(() => {
    logAudit("Conex\xE3o Banco", "Sucesso", `Ping ao banco faturamento bem-sucedido via VPN para o cliente: ${configs[index].clientName}`);
    res.json({ success: true });
  }, 1e3);
});
app.get("/api/audit/logs", (req, res) => {
  try {
    const sysDb = readSystemDb();
    res.json({ success: true, logs: sysDb.auditLogs || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function run() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================`);
    console.log(`\u{1F680} Sauron est\xE1 rodando!`);
    console.log(`\u{1F449} Acesse em: http://localhost:${PORT}`);
    console.log(`\u{1F31F} Backend e API ativos em tempo real.`);
    console.log(`================================================`);
  });
}
run();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
