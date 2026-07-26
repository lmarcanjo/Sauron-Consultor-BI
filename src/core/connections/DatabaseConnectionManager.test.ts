import { describe, it, expect, vi, beforeEach } from "vitest";
import { compareNetworkContexts, DatabaseConnectionManager, databaseConnectionManager } from "./DatabaseConnectionManager";

const mysqlMocks = vi.hoisted(() => ({
  createConnection: vi.fn(),
}));

vi.mock("pg", () => ({
  default: {
    Client: class {
      connect() {
        const err = new Error("password authentication failed");
        (err as any).code = "28P01";
        return Promise.reject(err);
      }
      end() { return Promise.resolve(); }
    }
  }
}));

vi.mock("mysql2/promise", () => ({
  default: mysqlMocks,
}));

describe("DatabaseConnectionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mysqlMocks.createConnection.mockRejectedValue(Object.assign(new Error("Access denied for user"), {
      code: "ER_ACCESS_DENIED_ERROR",
    }));
  });

  it("Host inválido retorna stage host", async () => {
    const result = await databaseConnectionManager.testConnection({
      type: "postgres",
      host: "host-invalido-inexistente-123.com",
      port: 5432
    });
    expect(result.success).toBe(false);
    expect(result.stage).toBe("host");
  });

  it("Query destrutiva é bloqueada", () => {
    expect(() => {
      databaseConnectionManager.assertReadOnlyQuery("DELETE FROM users");
    }).toThrow();

    expect(() => {
      databaseConnectionManager.assertReadOnlyQuery("DROP TABLE users");
    }).toThrow();
  });

  it("Query SELECT é permitida", () => {
    expect(() => {
      databaseConnectionManager.assertReadOnlyQuery("SELECT * FROM users");
    }).not.toThrow();

    expect(() => {
      databaseConnectionManager.assertReadOnlyQuery("SHOW TABLES");
    }).not.toThrow();
  });

  it("localhost gera dica de Docker", () => {
    const hintLocalhost = databaseConnectionManager.getDockerConnectionHint("localhost");
    expect(hintLocalhost).toContain("host.docker.internal");
    
    const hint127 = databaseConnectionManager.getDockerConnectionHint("127.0.0.1");
    expect(hint127).toContain("host.docker.internal");

    const hintRemote = databaseConnectionManager.getDockerConnectionHint("192.168.1.10");
    expect(hintRemote).toBe("");
  });

  it("não transforma socket TCP aberto em erro de porta fechada", async () => {
    const manager = DatabaseConnectionManager.createForTesting({
      dnsLookup: async () => undefined,
      tcpProbe: async () => ({ connected: true, elapsedMs: 4 }),
    });

    const result = await manager.testConnection({
      type: "mysql",
      host: "10.12.22.14",
      port: 3306,
      user: "readonly",
      password: "secret",
      database: "operacional",
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe("auth");
    expect(result.message).not.toContain("não conseguiu abrir o socket");
    expect(result.diagnostics?.stages.find(stage => stage.stage === "port")).toMatchObject({ status: "passed" });
    expect(result.diagnostics?.stages).not.toContainEqual(expect.objectContaining({ status: "skipped" }));
    expect(result.diagnostics?.runtime.process).toBe("node");
  });

  it("retorna falha de porta somente quando o probe TCP falha", async () => {
    const manager = DatabaseConnectionManager.createForTesting({
      dnsLookup: async () => undefined,
      tcpProbe: async () => ({ connected: false, elapsedMs: 4, code: "ETIMEDOUT", error: "timeout" }),
    });

    const result = await manager.testConnection({ type: "mysql", host: "10.12.22.14", port: 3306, password: "secret", database: "operacional" });

    expect(result.success).toBe(false);
    expect(result.stage).toBe("port");
    expect(result.message).toContain("processo Node");
    expect(result.diagnostics?.stages.find(stage => stage.stage === "port")).toMatchObject({ status: "failed" });
  });

  function mockSuccessfulMysqlConnection(overrides: { query?: (sql: string) => Promise<any> } = {}) {
    const queries: string[] = [];
    const connection = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql);
        if (overrides.query) return overrides.query(sql);
        if (sql.startsWith("SELECT VERSION")) return [[{ version: "5.7.18-log", current_user_value: "consultoria@%", database_name: "consultoria" }], []];
        if (sql === "START TRANSACTION READ ONLY") return [[], []];
        if (sql === "SHOW TABLES") return [[{ Tables_in_consultoria: "clientes" }], []];
        if (sql === "SELECT 1") return [[{ 1: 1 }], []];
        if (sql === "ROLLBACK") return [[], []];
        throw new Error(`Query inesperada: ${sql}`);
      }),
      end: vi.fn().mockResolvedValue(undefined),
    };
    mysqlMocks.createConnection.mockResolvedValue(connection);
    return { connection, queries };
  }

  function validMysqlConfig() {
    return {
      type: "mysql",
      host: "10.12.22.14",
      port: 3306,
      user: "consultoria",
      password: "secret",
      database: "consultoria",
    };
  }

  it("MySQL 5.7 aceita START TRANSACTION READ ONLY sem consultar tx_read_only", async () => {
    const { connection, queries } = mockSuccessfulMysqlConnection();
    const manager = DatabaseConnectionManager.createForTesting({
      dnsLookup: async () => undefined,
      tcpProbe: async () => ({ connected: true, elapsedMs: 3, localAddress: "172.30.1.190" }),
    });

    const result = await manager.testConnection(validMysqlConfig());

    expect(mysqlMocks.createConnection).toHaveBeenCalledOnce();
    expect(connection.query).toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, stage: "readonly" });
    expect(result.serverInfo).toEqual({ version: "5.7.18-log", currentUser: "consultoria@%", database: "consultoria" });
    expect(queries).toEqual([
      "SELECT VERSION() AS version, CURRENT_USER() AS current_user_value, DATABASE() AS database_name",
      "START TRANSACTION READ ONLY",
      "SHOW TABLES",
      "SELECT 1",
      "ROLLBACK",
    ]);
    expect(result.diagnostics?.stages.every(stage => stage.status === "passed")).toBe(true);
    expect(result.diagnostics?.stages.some(stage => stage.status === "skipped")).toBe(false);
    expect(result.diagnostics?.correlationId).toMatch(/^db-/);
    expect(result.diagnostics?.stageTimings.length).toBeGreaterThanOrEqual(7);
    expect(connection.end).toHaveBeenCalledTimes(1);
    expect(result.message).toBe("Conexão MySQL validada; consultas de certificação executadas em transação somente leitura.");
    expect(connection.query.mock.invocationCallOrder.at(-1)).toBeLessThan(connection.end.mock.invocationCallOrder[0]);
  });

  it("mysql2 executado com erro de handshake retorna FAILED handshake", async () => {
    mysqlMocks.createConnection.mockRejectedValue(Object.assign(new Error("MySQL handshake failed"), { code: "HANDSHAKE_FAILED" }));
    const manager = DatabaseConnectionManager.createForTesting({
      dnsLookup: async () => undefined,
      tcpProbe: async () => ({ connected: true, elapsedMs: 1 }),
    });

    const result = await manager.testConnection(validMysqlConfig());

    expect(result.stage).toBe("handshake");
    expect(result.diagnostics?.stages.at(-1)).toMatchObject({ stage: "handshake", status: "failed" });
    expect(result.diagnostics?.stages.some(stage => stage.status === "skipped")).toBe(false);
    expect(result.error?.code).toBe("HANDSHAKE_FAILED");
  });

  it("ER_ACCESS_DENIED_ERROR retorna FAILED auth após handshake", async () => {
    const result = await DatabaseConnectionManager.createForTesting({
      dnsLookup: async () => undefined,
      tcpProbe: async () => ({ connected: true, elapsedMs: 1 }),
    }).testConnection(validMysqlConfig());

    expect(result.stage).toBe("auth");
    expect(result.diagnostics?.stages.map(stage => `${stage.stage}:${stage.status}`)).toEqual([
      "configuration:passed", "route:passed", "host:passed", "port:passed", "handshake:passed", "auth:failed",
    ]);
  });

  it("ER_BAD_DB_ERROR retorna FAILED database", async () => {
    mysqlMocks.createConnection.mockRejectedValue(Object.assign(new Error("Unknown database 'consultoria'"), { code: "ER_BAD_DB_ERROR" }));
    const manager = DatabaseConnectionManager.createForTesting({
      dnsLookup: async () => undefined,
      tcpProbe: async () => ({ connected: true, elapsedMs: 1 }),
    });

    const result = await manager.testConnection(validMysqlConfig());

    expect(result.stage).toBe("database");
    expect(result.diagnostics?.stages.at(-1)).toMatchObject({ stage: "database", status: "failed" });
  });

  it("preserva colunas físicas quando a carga do banco não tem mapeamento", async () => {
    const rows = [{ A001: "linha", B002: 42, C003: "2026-07-22" }];
    const connection = {
      query: vi.fn(async (sql: string) => [sql.startsWith("SELECT *") ? rows : [], []]),
      end: vi.fn().mockResolvedValue(undefined),
    };
    mysqlMocks.createConnection.mockResolvedValue(connection);

    const result = await databaseConnectionManager.executeFetchAndMap({
      type: "mysql",
      host: "10.12.22.14",
      port: 3306,
      user: "consultoria",
      password: "secret",
      database: "consultoria",
      tableName: "dados",
      mappings: {},
    });

    expect(result[0]).toMatchObject(rows[0]);
    expect(result[0]).not.toHaveProperty("Receita");
    expect(connection.end).toHaveBeenCalledTimes(1);
  });

  it("aceita mapeamento parcial sem criar campos não escolhidos", async () => {
    const connection = {
      query: vi.fn(async (sql: string) => [sql.startsWith("SELECT *") ? [{ A001: "linha", B002: 42 }] : [], []]),
      end: vi.fn().mockResolvedValue(undefined),
    };
    mysqlMocks.createConnection.mockResolvedValue(connection);

    const result = await databaseConnectionManager.executeFetchAndMap({
      type: "mysql",
      host: "10.12.22.14",
      port: 3306,
      user: "consultoria",
      password: "secret",
      database: "consultoria",
      tableName: "dados",
      mappings: { Receita: "B002" },
    });

    expect(result[0]).toMatchObject({ A001: "linha", B002: 42, Receita: 42 });
    expect(result[0]).not.toHaveProperty("Custo");
    expect(result[0]).not.toHaveProperty("Lucro");
    expect(connection.end).toHaveBeenCalledTimes(1);
  });

  it("database selecionado diferente do solicitado encerra a conexão uma vez", async () => {
    const { connection } = mockSuccessfulMysqlConnection({
      query: async (sql) => {
        if (sql.startsWith("SELECT VERSION")) {
          return [[{ version: "5.7.18-log", current_user_value: "consultoria@%", database_name: "outro" }], []];
        }
        return [[], []];
      },
    });
    const manager = DatabaseConnectionManager.createForTesting({ dnsLookup: async () => undefined, tcpProbe: async () => ({ connected: true, elapsedMs: 1 }) });

    const result = await manager.testConnection(validMysqlConfig());

    expect(result.stage).toBe("database");
    expect(connection.end).toHaveBeenCalledTimes(1);
  });

  it("falha na consulta de validação do database encerra a conexão uma vez", async () => {
    const { connection } = mockSuccessfulMysqlConnection({
      query: async (sql) => {
        if (sql.startsWith("SELECT VERSION")) throw Object.assign(new Error("database validation failed"), { code: "PROTOCOL_CONNECTION_LOST" });
        return [[], []];
      },
    });
    const manager = DatabaseConnectionManager.createForTesting({ dnsLookup: async () => undefined, tcpProbe: async () => ({ connected: true, elapsedMs: 1 }) });

    const result = await manager.testConnection(validMysqlConfig());

    expect(result.stage).toBe("database");
    expect(connection.end).toHaveBeenCalledTimes(1);
  });

  it("schema inexistente retorna FAILED schema", async () => {
    const { connection, queries } = mockSuccessfulMysqlConnection({
      query: async (sql) => {
        if (sql === "SHOW TABLES") throw Object.assign(new Error("table access denied"), { code: "ER_TABLEACCESS_DENIED_ERROR" });
        if (sql.startsWith("SELECT VERSION")) return [[{ version: "5.7.18-log", current_user_value: "consultoria@%", database_name: "consultoria" }], []];
        if (sql === "START TRANSACTION READ ONLY") return [[], []];
        return [[], []];
      },
    });
    const manager = DatabaseConnectionManager.createForTesting({ dnsLookup: async () => undefined, tcpProbe: async () => ({ connected: true, elapsedMs: 1 }) });

    const result = await manager.testConnection(validMysqlConfig());

    expect(queries).toContain("SHOW TABLES");
    expect(result.stage).toBe("schema");
    expect(connection.end).toHaveBeenCalledTimes(1);
    expect(connection.query.mock.invocationCallOrder.at(-1)).toBeLessThan(connection.end.mock.invocationCallOrder[0]);
  });

  it("SELECT 1 falhando retorna FAILED query", async () => {
    const { connection } = mockSuccessfulMysqlConnection({
      query: async (sql) => {
        if (sql === "SELECT 1") throw Object.assign(new Error("read query denied"), { code: "ER_TABLEACCESS_DENIED_ERROR" });
        if (sql.startsWith("SELECT VERSION")) return [[{ version: "5.7.18-log", current_user_value: "consultoria@%", database_name: "consultoria" }], []];
        return [[], []];
      },
    });
    const manager = DatabaseConnectionManager.createForTesting({ dnsLookup: async () => undefined, tcpProbe: async () => ({ connected: true, elapsedMs: 1 }) });

    const result = await manager.testConnection(validMysqlConfig());

    expect(result.stage).toBe("query");
    expect(connection.end).toHaveBeenCalledTimes(1);
  });

  it("falha ao iniciar transação somente leitura retorna FAILED readonly", async () => {
    const { connection, queries } = mockSuccessfulMysqlConnection({
      query: async (sql) => {
        if (sql.startsWith("SELECT VERSION")) return [[{ version: "5.7.18-log", current_user_value: "consultoria@%", database_name: "consultoria" }], []];
        if (sql === "START TRANSACTION READ ONLY") throw Object.assign(new Error("READ ONLY transaction rejected"), { code: "ER_CANT_CHANGE_TX_CHARACTERISTICS" });
        return [[], []];
      },
    });
    const manager = DatabaseConnectionManager.createForTesting({ dnsLookup: async () => undefined, tcpProbe: async () => ({ connected: true, elapsedMs: 1 }) });

    const result = await manager.testConnection(validMysqlConfig());

    expect(result.stage).toBe("readonly");
    expect(result.message).toContain("somente leitura");
    expect(queries).toContain("START TRANSACTION READ ONLY");
    expect(connection.end).toHaveBeenCalledTimes(1);
  });

  it("falha no ROLLBACK encerra a conexão uma vez após tentar rollback", async () => {
    const { connection } = mockSuccessfulMysqlConnection({
      query: async (sql) => {
        if (sql === "ROLLBACK") throw Object.assign(new Error("rollback failed"), { code: "ER_ROLLBACK" });
        if (sql.startsWith("SELECT VERSION")) return [[{ version: "5.7.18-log", current_user_value: "consultoria@%", database_name: "consultoria" }], []];
        return [[], []];
      },
    });
    const manager = DatabaseConnectionManager.createForTesting({ dnsLookup: async () => undefined, tcpProbe: async () => ({ connected: true, elapsedMs: 1 }) });

    const result = await manager.testConnection(validMysqlConfig());

    expect(result.stage).toBe("readonly");
    expect(result.success).toBe(false);
    expect(connection.query).toHaveBeenCalledWith("ROLLBACK");
    expect(connection.end).toHaveBeenCalledTimes(1);
  });

  it("database vazio retorna FAILED configuration sem chamar driver", async () => {
    const manager = DatabaseConnectionManager.createForTesting({ dnsLookup: async () => undefined, tcpProbe: async () => ({ connected: true, elapsedMs: 1 }) });

    const result = await manager.testConnection({ ...validMysqlConfig(), database: "" });

    expect(result.stage).toBe("configuration");
    expect(result.message).toBe("Database obrigatório.");
    expect(mysqlMocks.createConnection).not.toHaveBeenCalled();
  });

  it("senha vazia retorna FAILED configuration sem chamar driver", async () => {
    const manager = DatabaseConnectionManager.createForTesting({ dnsLookup: async () => undefined, tcpProbe: async () => ({ connected: true, elapsedMs: 1 }) });

    const result = await manager.testConnection({ ...validMysqlConfig(), password: "" });

    expect(result.stage).toBe("configuration");
    expect(result.message).toContain("Senha do MySQL obrigatória");
    expect(mysqlMocks.createConnection).not.toHaveBeenCalled();
  });

  it("registra rota, endereco local e duracao do socket no diagnostico de runtime", async () => {
    const manager = DatabaseConnectionManager.createForTesting({
      routeProbe: async (host) => ({
        status: "passed",
        host,
        resolvedAddress: "10.12.22.14",
        family: 4,
        interfaceName: "tun0",
        localAddress: "10.8.0.2",
      }),
      tcpProbe: async () => ({
        connected: true,
        elapsedMs: 12,
        localAddress: "10.8.0.2",
        localPort: 42100,
        remoteAddress: "10.12.22.14",
        remotePort: 3306,
      }),
    });

    const result = await manager.diagnoseNetworkContext("10.12.22.14", 3306, "mysql");

    expect(result.routeProbe).toMatchObject({ status: "passed", interfaceName: "tun0" });
    expect(result.tcpProbe).toMatchObject({
      status: "passed",
      connected: true,
      localAddress: "10.8.0.2",
      remoteAddress: "10.12.22.14",
      elapsedMs: 12,
    });
    expect(result.runtime.process).toBe("node");
  });

  it("probe de rede não lista etapas de driver como SKIPPED", async () => {
    const manager = DatabaseConnectionManager.createForTesting({
      routeProbe: async (host) => ({ status: "passed", host, resolvedAddress: host, interfaceName: "tun0" }),
      tcpProbe: async () => ({ connected: true, elapsedMs: 2, localAddress: "172.30.1.190" }),
    });

    const result = await manager.testNetworkPath("10.12.22.14", 3306, "mysql");

    expect(result.success).toBe(true);
    expect(result.diagnostics?.stages.map(stage => stage.stage)).toEqual(["route", "host", "port"]);
    expect(result.diagnostics?.stages.some(stage => stage.status === "skipped")).toBe(false);
  });

  it("detecta quando dois processos nao compartilham contexto de rede", () => {
    const base = databaseConnectionManager.getRuntimeContext();
    const other = {
      ...base,
      effectiveUser: { uid: 1001, username: "outro-usuario" },
      processExecutable: "/snap/bin/node",
      networkNamespaceId: "999999",
      containerized: true,
    };

    const comparison = compareNetworkContexts(base, other);

    expect(comparison.divergent).toBe(true);
    expect(comparison.differences).toEqual(expect.arrayContaining([
      "usuário efetivo diferente",
      "namespace de rede diferente",
      "executável Node diferente",
      "sinal de containerização diferente",
    ]));
  });
});
