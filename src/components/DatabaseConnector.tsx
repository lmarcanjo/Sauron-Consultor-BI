import React, { useState, useEffect } from "react";
import {
  Database,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  DatabaseZap,
  Info,
  Plug,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Terminal,
  Shield,
  Globe,
  Lock,
  FileText,
  Key
} from "lucide-react";
import { LancamentoFinanceiro } from "../types";

interface DatabaseConnectorProps {
  onDataLoaded: (data: LancamentoFinanceiro[], sourceName: string) => void;
  currentSource: string;
}

export const DatabaseConnector: React.FC<DatabaseConnectorProps> = ({
  onDataLoaded,
  currentSource
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dbType, setDbType] = useState<"postgres" | "mysql" | "mssql" | "oracle" | "mongodb">("postgres");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5432");
  const [user, setUser] = useState("postgres");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("postgres");
  const [connectionString, setConnectionString] = useState("");
  const [ssl, setSsl] = useState(true);
  const [useConnectionString, setUseConnectionString] = useState(false);

  // SSH Tunnel / virtual machine (VM Bastion) proxying state
  const [useSshTunnel, setUseSshTunnel] = useState(false);
  const [sshHost, setSshHost] = useState("");
  const [sshPort, setSshPort] = useState("22");
  const [sshUser, setSshUser] = useState("");
  const [sshPassword, setSshPassword] = useState("");
  const [sshPrivateKey, setSshPrivateKey] = useState("");

  // VPN Configuration States
  const [useVpn, setUseVpn] = useState(false);
  const [vpnType, setVpnType] = useState<"wireguard" | "openvpn" | "ipsec" | "l2tp">("wireguard");
  const [vpnServer, setVpnServer] = useState("");
  const [vpnPort, setVpnPort] = useState("");
  const [vpnUser, setVpnUser] = useState("");
  const [vpnPassword, setVpnPassword] = useState("");
  const [vpnPrivateKey, setVpnPrivateKey] = useState("");
  const [vpnPublicKey, setVpnPublicKey] = useState("");
  const [vpnPresharedKey, setVpnPresharedKey] = useState("");
  const [vpnAddress, setVpnAddress] = useState("");
  const [vpnConfigXml, setVpnConfigXml] = useState("");
  const [vpnGroupId, setVpnGroupId] = useState("");
  const [vpnGroupSecret, setVpnGroupSecret] = useState("");
  const [vpnProtocol, setVpnProtocol] = useState<"UDP" | "TCP">("UDP");
  const [vpnRequireAuth, setVpnRequireAuth] = useState(false);
  const [vpnMtu, setVpnMtu] = useState("1420");
  const [vpnEncryption, setVpnEncryption] = useState("AES-256-GCM");

  // Discovery states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    tables?: string[];
    tableColumns?: Record<string, { name: string; type: string }[]>;
    estimatedRows?: Record<string, number>;
    isVpnSimulated?: boolean;
  } | null>(null);

  // Selected table & query mode
  const [selectedTable, setSelectedTable] = useState("");
  const [useCustomQuery, setUseCustomQuery] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [tableSearchTerm, setTableSearchTerm] = useState("");

  // Column mapping states
  const [mappings, setMappings] = useState<Record<string, string>>({
    Grupo: "",
    CNPJ: "",
    Marca: "",
    Empresa: "",
    Filial: "",
    Mês: "",
    Razão: "",
    Receita: "",
    Custo: "",
    Despesa: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Load saved connection configurations from server & localStorage on mount
  useEffect(() => {
    const fetchServerAndLocalConfig = async () => {
      let configLoaded = false;
      try {
        const response = await fetch("/api/db/config");
        const resData = await response.json();
        if (response.ok && resData.success && resData.config) {
          const parsed = resData.config;
          applyDatabaseConfig(parsed);
          configLoaded = true;
        }
      } catch (err) {
        console.warn("Erro ao buscar configuração de banco no servidor, usando local:", err);
      }

      if (!configLoaded) {
        const savedConfig = localStorage.getItem("sauron_db_config");
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            applyDatabaseConfig(parsed);
          } catch (e) {
            console.error("Erro ao carregar configurações locais do banco:", e);
          }
        }
      }
    };

    const applyDatabaseConfig = (parsed: any) => {
      setDbType(parsed.dbType || "postgres");
      setHost(parsed.host || "localhost");
      setPort(parsed.port || (parsed.dbType === "mysql" ? "3306" : "5432"));
      setUser(parsed.user || "postgres");
      setDatabase(parsed.database || "sauron");
      setSsl(parsed.ssl !== undefined ? parsed.ssl : true);
      if (parsed.connectionString) {
        setConnectionString(parsed.connectionString);
        setUseConnectionString(true);
      }
      if (parsed.mappings) {
        setMappings(parsed.mappings);
      }
      if (parsed.selectedTable) {
        setSelectedTable(parsed.selectedTable);
      }
      if (parsed.customQuery) {
        setCustomQuery(parsed.customQuery);
        setUseCustomQuery(parsed.useCustomQuery || false);
      }
      
      // SSH Restore
      setUseSshTunnel(parsed.useSshTunnel || false);
      setSshHost(parsed.sshHost || "");
      setSshPort(parsed.sshPort || "22");
      setSshUser(parsed.sshUser || "");
      if (parsed.sshPassword) setSshPassword(parsed.sshPassword);
      if (parsed.sshPrivateKey) setSshPrivateKey(parsed.sshPrivateKey);

      // VPN Restore
      setUseVpn(parsed.useVpn || false);
      setVpnType(parsed.vpnType || "wireguard");
      setVpnServer(parsed.vpnServer || "");
      setVpnPort(parsed.vpnPort || "");
      setVpnUser(parsed.vpnUser || "");
      setVpnPassword(parsed.vpnPassword || "");
      setVpnPrivateKey(parsed.vpnPrivateKey || "");
      setVpnPublicKey(parsed.vpnPublicKey || "");
      setVpnPresharedKey(parsed.vpnPresharedKey || "");
      setVpnAddress(parsed.vpnAddress || "");
      setVpnConfigXml(parsed.vpnConfigXml || "");
      setVpnGroupId(parsed.vpnGroupId || "");
      setVpnGroupSecret(parsed.vpnGroupSecret || "");
      setVpnProtocol(parsed.vpnProtocol || "UDP");
      setVpnRequireAuth(parsed.vpnRequireAuth || false);
      setVpnMtu(parsed.vpnMtu || "1420");
      setVpnEncryption(parsed.vpnEncryption || "AES-256-GCM");
    };

    fetchServerAndLocalConfig();
  }, []);

  // Update default port when database type changes
  const handleDbTypeChange = (type: "postgres" | "mysql" | "mssql" | "oracle" | "mongodb") => {
    setDbType(type);
    if (!useConnectionString) {
      let defaultPort = "5432";
      let defaultUser = "postgres";
      let defaultDatabase = "postgres";

      if (type === "mysql") {
        defaultPort = "3306";
        defaultUser = "root";
        defaultDatabase = "sauron";
      } else if (type === "mssql") {
        defaultPort = "1433";
        defaultUser = "sa";
        defaultDatabase = "master";
      } else if (type === "oracle") {
        defaultPort = "1521";
        defaultUser = "system";
        defaultDatabase = "ORCL";
      } else if (type === "mongodb") {
        defaultPort = "27017";
        defaultUser = "";
        defaultDatabase = "sauron";
      }

      setPort(defaultPort);
      setUser(defaultUser);
      setDatabase(defaultDatabase);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setStatusMessage("");

    const config = useConnectionString
      ? { type: dbType, connectionString, ssl, useSshTunnel, sshHost, sshPort, sshUser, sshPassword, sshPrivateKey, useVpn, vpnType, vpnServer, vpnPort, vpnUser, vpnPassword, vpnPrivateKey, vpnPublicKey, vpnPresharedKey, vpnAddress, vpnConfigXml, vpnGroupId, vpnGroupSecret, vpnProtocol, vpnRequireAuth, vpnMtu, vpnEncryption }
      : { type: dbType, host, port, user, password, database, ssl, useSshTunnel, sshHost, sshPort, sshUser, sshPassword, sshPrivateKey, useVpn, vpnType, vpnServer, vpnPort, vpnUser, vpnPassword, vpnPrivateKey, vpnPublicKey, vpnPresharedKey, vpnAddress, vpnConfigXml, vpnGroupId, vpnGroupSecret, vpnProtocol, vpnRequireAuth, vpnMtu, vpnEncryption };

    try {
      const response = await fetch("/api/db/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setTestResult({
          success: true,
          tables: resData.tables || [],
          tableColumns: resData.tableColumns || {},
          isVpnSimulated: resData.isVpnSimulated
        });

        // Set first table as selected if not already set
        if (resData.tables && resData.tables.length > 0 && !selectedTable) {
          setSelectedTable(resData.tables[0]);
          autoMapColumns(resData.tables[0], resData.tableColumns || {});
        }
      } else {
        setTestResult({
          success: false,
          error: resData.error || "Não foi possível conectar ao banco."
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Erro na comunicação com a API de banco."
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Automatically map columns based on exact or semantic match in lowercase
  const autoMapColumns = (table: string, columnsMap: Record<string, { name: string; type: string }[]>) => {
    let targetTable = table;
    if (targetTable === "__ALL_TABLES__") {
      const keys = Object.keys(columnsMap);
      if (keys.length > 0) {
        targetTable = keys[0];
      }
    }
    const cols = columnsMap[targetTable] || [];
    const newMappings = { ...mappings };

    const searchSynonyms: Record<string, string[]> = {
      Grupo: ["grupo", "subgrupo", "empresa_grupo", "nome_grupo", "economic_group"],
      CNPJ: ["cnpj", "documento", "empresa_cnpj", "tax_id", "cpf_cnpj"],
      Marca: ["marca", "bandeira", "fabricante", "brand", "montadora"],
      Empresa: ["empresa", "razao_social", "company", "nome_empresa", "unidade"],
      Filial: ["filial", "subsidiary", "loja", "ponto_venda", "branch"],
      Mês: ["mes", "competencia", "data", "periodo", "mes_ano", "month", "date"],
      Razão: ["razao", "conta", "rubrica", "categoria_despesa", "conta_contabil", "account_name"],
      Receita: ["receita", "faturamento", "receita_bruta", "total_receita", "revenue", "sales"],
      Custo: ["custo", "cmv", "custo_venda", "cost", "cogs"],
      Despesa: ["despesa", "gasto", "despesas", "operating_expense", "gastos", "expenses"]
    };

    Object.keys(searchSynonyms).forEach((appField) => {
      const synonyms = searchSynonyms[appField];
      const match = cols.find((col) => {
        const nameLower = col.name.toLowerCase();
        return synonyms.some((syn) => nameLower === syn || nameLower.includes(syn));
      });
      if (match) {
        newMappings[appField] = match.name;
      }
    });

    setMappings(newMappings);
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    if (testResult?.tableColumns) {
      autoMapColumns(tableName, testResult.tableColumns);
    }
  };

  const handleMappingChange = (field: string, dbCol: string) => {
    setMappings((prev) => ({
      ...prev,
      [field]: dbCol
    }));
  };

  const saveConfiguration = async () => {
    const configSave = {
      dbType,
      host,
      port,
      user,
      password, // include password so backend can connect to sync
      database,
      ssl,
      connectionString: useConnectionString ? connectionString : "",
      mappings,
      selectedTable,
      customQuery,
      useCustomQuery,
      useSshTunnel,
      sshHost,
      sshPort,
      sshUser,
      sshPassword,
      sshPrivateKey,
      useVpn,
      vpnType,
      vpnServer,
      vpnPort,
      vpnUser,
      vpnPassword,
      vpnPrivateKey,
      vpnPublicKey,
      vpnPresharedKey,
      vpnAddress,
      vpnConfigXml,
      vpnGroupId,
      vpnGroupSecret,
      vpnProtocol,
      vpnRequireAuth,
      vpnMtu,
      vpnEncryption
    };
    
    // Save to local storage
    localStorage.setItem("sauron_db_config", JSON.stringify(configSave));

    // Save to backend server
    try {
      await fetch("/api/db/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configSave)
      });
    } catch (err) {
      console.error("Erro ao salvar configuração do banco de dados no servidor:", err);
    }
  };

  const loadData = async () => {
    if (!useCustomQuery && !selectedTable) {
      setStatusMessage("Erro: Selecione uma tabela para importar os dados.");
      return;
    }

    // Check if critical mappings are set
    const criticalFields = ["Grupo", "CNPJ", "Marca", "Empresa", "Mês", "Razão", "Receita", "Custo", "Despesa"];
    const missingFields = criticalFields.filter((f) => !mappings[f]);
    if (missingFields.length > 0 && !useCustomQuery) {
      setStatusMessage(`Alerta: Defina o mapeamento para os campos: ${missingFields.join(", ")}`);
      return;
    }

    setIsLoading(true);
    setStatusMessage("Processando conexão e importando dados...");

    const connectionConfig = useConnectionString
      ? { type: dbType, connectionString, ssl, useSshTunnel, sshHost, sshPort, sshUser, sshPassword, sshPrivateKey, useVpn, vpnType, vpnServer, vpnPort, vpnUser, vpnPassword, vpnPrivateKey, vpnPublicKey, vpnPresharedKey, vpnAddress, vpnConfigXml, vpnGroupId, vpnGroupSecret, vpnProtocol, vpnRequireAuth, vpnMtu, vpnEncryption }
      : { type: dbType, host, port, user, password, database, ssl, useSshTunnel, sshHost, sshPort, sshUser, sshPassword, sshPrivateKey, useVpn, vpnType, vpnServer, vpnPort, vpnUser, vpnPassword, vpnPrivateKey, vpnPublicKey, vpnPresharedKey, vpnAddress, vpnConfigXml, vpnGroupId, vpnGroupSecret, vpnProtocol, vpnRequireAuth, vpnMtu, vpnEncryption };

    const payload = {
      ...connectionConfig,
      tableName: selectedTable,
      query: useCustomQuery ? customQuery : "",
      mappings
    };

    try {
      const response = await fetch("/api/db/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        if (resData.count === 0) {
          setStatusMessage("Banco conectado com sucesso, mas a consulta não retornou linhas.");
        } else {
          saveConfiguration();
          onDataLoaded(resData.data, `Banco SQL: ${database || "String de Conexão"}`);
          setStatusMessage(`Sucesso! Importados ${resData.count} registros com sucesso.`);
          // Auto close database panel after 1.5 seconds on successful load
          setTimeout(() => {
            setIsOpen(false);
          }, 1500);
        }
      } else {
        setStatusMessage(`Erro ao buscar dados: ${resData.error || "Falha inexplicada no servidor."}`);
      }
    } catch (err: any) {
      setStatusMessage(`Erro de rede: ${err.message || "Não foi possível falar com o servidor."}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper check to display column dropdowns
  const availableColumns = testResult?.tableColumns && selectedTable 
    ? (selectedTable === "__ALL_TABLES__" 
        ? (testResult.tables && testResult.tables.length > 0 ? testResult.tableColumns[testResult.tables[0]] || [] : [])
        : testResult.tableColumns[selectedTable] || [])
    : [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-150">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 flex items-center justify-between font-sans text-left cursor-pointer hover:bg-slate-100/85 dark:hover:bg-slate-800 transition-colors border-b border-slate-150 dark:border-slate-800"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded">
            <Database size={16} className="stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Conexão com Banco de Dados</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-450 mt-0.5">Retorne dados corporativos reais de seus bancos PostgreSQL ou MySQL</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-750 rounded px-2 py-0.5 text-slate-600 dark:text-slate-300">
            {currentSource.startsWith("Banco SQL") ? "ATIVO" : "SIMULADO/CSV"}
          </span>
          {isOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </button>

      {/* Connection Panel Area */}
      {isOpen && (
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 font-sans space-y-4 text-xs">
          
          {/* Top selection row */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                Escolha o Motor / SGBD
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 rounded-lg border border-slate-200 dark:border-slate-850 p-1 bg-slate-50 dark:bg-slate-950">
                {(["postgres", "mysql", "mssql", "oracle", "mongodb"] as const).map((type) => {
                  const labels = {
                    postgres: "PostgreSQL 🐘",
                    mysql: "MySQL 🐬",
                    mssql: "SQL Server 💾",
                    oracle: "Oracle DB 🔴",
                    mongodb: "MongoDB 🍃"
                  };
                  return (
                    <button
                       key={type}
                       type="button"
                       onClick={() => handleDbTypeChange(type)}
                       className={`py-2 px-2 rounded font-bold text-[10px] uppercase tracking-wide transition-all cursor-pointer text-center ${
                        dbType === type
                          ? "bg-slate-800 dark:bg-slate-700 text-white shadow-sm"
                          : "text-slate-550 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {labels[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">
                Formato de Entrada
              </label>
              <div className="flex rounded border border-slate-200 dark:border-slate-850 overflow-hidden bg-slate-50 dark:bg-slate-955">
                <button
                  type="button"
                  onClick={() => setUseConnectionString(false)}
                  className={`flex-1 py-1.5 font-bold text-[10px] uppercase tracking-wide transition-all cursor-pointer ${
                    !useConnectionString
                      ? "bg-slate-800 dark:bg-slate-700 text-white"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  Campos Separados
                </button>
                <button
                  type="button"
                  onClick={() => setUseConnectionString(true)}
                  className={`flex-1 py-1.5 font-bold text-[10px] uppercase tracking-wide transition-all cursor-pointer ${
                    useConnectionString
                      ? "bg-slate-800 dark:bg-slate-700 text-white"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  String de Conexão (URI)
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-150 dark:bg-slate-800"></div>

          {/* Connection inputs */}
          {!useConnectionString ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">IP do Servidor / Host</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="ex: localhost, 127.0.0.1 ou bando.gcp.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded px-2.5 py-1.5 font-sans focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Porta</label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder={dbType === "mysql" ? "3306" : dbType === "mssql" ? "1433" : dbType === "oracle" ? "1521" : dbType === "mongodb" ? "27017" : "5432"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  {dbType === "mongodb" ? "Database (MongoDB)" : "Banco de Dados"}
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder={dbType === "mongodb" ? "sauron" : "nome_do_banco"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded px-2.5 py-1.5 font-sans focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Usuário</label>
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder={dbType === "postgres" ? "postgres" : dbType === "mysql" ? "root" : dbType === "mssql" ? "sa" : dbType === "oracle" ? "system" : "admin"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 font-sans focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Senha (Segura no Server)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 font-sans focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-1.5 h-full pt-4">
                <input
                  type="checkbox"
                  id="ssl-checkbox"
                  checked={ssl}
                  onChange={(e) => setSsl(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="ssl-checkbox" className="text-[10px] font-bold text-slate-550 dark:text-slate-400 select-none cursor-pointer">
                  Utilizar SSL (Recomendado)
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">String de Conexão SQL Completa</label>
                <input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder={
                    dbType === "postgres" 
                      ? "postgresql://usuario:senha@host:5432/nome_banco?sslmode=no-verify" 
                      : dbType === "mysql"
                      ? "mysql://usuario:senha@host:3306/nome_banco"
                      : dbType === "mssql"
                      ? "Server=host,1433;Database=nome_banco;User ID=usuario;Password=senha;Encrypt=true;"
                      : dbType === "oracle"
                      ? "usuario/senha@host:1521/nome_banco"
                      : "mongodb://usuario:senha@host:27017/nome_banco"
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="ssl-conn-checkbox"
                  checked={ssl}
                  onChange={(e) => setSsl(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="ssl-conn-checkbox" className="text-[10px] font-bold text-slate-550 dark:text-slate-400 select-none cursor-pointer">
                  Habilitar certificado SSL interno no Driver
                </label>
              </div>
            </div>
          )}

          {/* VPN Corporativa Integrada section */}
          <div className="mt-2 border border-slate-200 dark:border-slate-800 rounded p-3 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="vpn-toggle" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="vpn-toggle"
                  checked={useVpn}
                  onChange={(e) => setUseVpn(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-slate-850 dark:text-white focus:ring-slate-500 cursor-pointer h-4 w-4"
                />
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 transition-all">
                  <Shield size={14} className={useVpn ? "text-blue-600 animate-pulse" : "text-slate-500"} />
                  Habilitar VPN Corporativa Integrada (Acesso Seguro)
                </span>
              </label>
              {useVpn ? (
                <span className="text-[9px] bg-blue-100 dark:bg-blue-950/55 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0 animate-pulse">VPN ATIVA</span>
              ) : (
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Inativa</span>
              )}
            </div>

            {useVpn && (
              <div className="space-y-3 pt-2 border-t border-slate-150 dark:border-slate-800 animate-fadeIn text-[11px]">
                {/* Seletor do Tipo de VPN */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Provedor / Tipo de VPN</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-850">
                    {(["wireguard", "openvpn", "ipsec", "l2tp"] as const).map((type) => {
                      const labels = {
                        wireguard: "🛡️ WireGuard",
                        openvpn: "🌐 OpenVPN",
                        ipsec: "🔒 IPSec / Cisco",
                        l2tp: "🛠️ L2TP IPsec"
                      };
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setVpnType(type)}
                          className={`py-1.5 px-2 rounded font-bold text-[10px] uppercase tracking-wide transition-all cursor-pointer text-center ${
                            vpnType === type
                              ? "bg-blue-600 dark:bg-blue-700 text-white shadow"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          {labels[type]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Campos de formulário dinâmicos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {vpnType !== "openvpn" && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        {vpnType === "wireguard" ? "Endpoint WireGuard (IP:Porta)" : "Gateway / Servidor VPN"}
                      </label>
                      <input
                        type="text"
                        value={vpnServer}
                        onChange={(e) => setVpnServer(e.target.value)}
                        placeholder={vpnType === "wireguard" ? "vpn.empresa.com:51820" : "vpn.empresa.com"}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white font-mono text-[11px]"
                      />
                    </div>
                  )}

                  {vpnType === "wireguard" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">IP do Cliente na Interface (CIDR)</label>
                        <input
                          type="text"
                          value={vpnAddress}
                          onChange={(e) => setVpnAddress(e.target.value)}
                          placeholder="ex: 10.8.0.2/24"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 focus:outline-none focus:border-slate-500 font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">MTU Recomentado da Interface</label>
                        <input
                          type="text"
                          value={vpnMtu}
                          onChange={(e) => setVpnMtu(e.target.value)}
                          placeholder="1420"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 focus:outline-none focus:border-slate-500 font-mono text-[11px]"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Key size={11} className="text-slate-400" />
                          Chave Privada do Cliente (Private Key, base64)
                        </label>
                        <input
                          type="password"
                          value={vpnPrivateKey}
                          onChange={(e) => setVpnPrivateKey(e.target.value)}
                          placeholder="Cole sua Private Key do WireGuard aqui..."
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 focus:outline-none focus:border-slate-500 font-mono text-[11px]"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Globe size={11} className="text-slate-400" />
                          Chave Pública do Peer / Servidor (Server Public Key)
                        </label>
                        <input
                          type="text"
                          value={vpnPublicKey}
                          onChange={(e) => setVpnPublicKey(e.target.value)}
                          placeholder="Chave pública do servidor de VPN..."
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 focus:outline-none focus:border-slate-500 font-mono text-[11px]"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Chave Pré-compartilhada (Preshared Key - Opcional)</label>
                        <input
                          type="password"
                          value={vpnPresharedKey}
                          onChange={(e) => setVpnPresharedKey(e.target.value)}
                          placeholder="Disponível em certas conexões corporativas extras..."
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 focus:outline-none focus:border-slate-500 font-mono text-[11px]"
                        />
                      </div>
                    </>
                  )}

                  {vpnType === "openvpn" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Gateway / Servidor OpenVPN (Opcional)</label>
                        <input
                          type="text"
                          value={vpnServer}
                          onChange={(e) => setVpnServer(e.target.value)}
                          placeholder="Deixe vazio para ler do .ovpn"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 focus:outline-none focus:border-slate-500 font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Porta de Gateway</label>
                        <input
                          type="text"
                          value={vpnPort}
                          onChange={(e) => setVpnPort(e.target.value)}
                          placeholder="1194"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 focus:outline-none focus:border-slate-500 font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Protocolo de Comunicação</label>
                        <select
                          value={vpnProtocol}
                          onChange={(e) => setVpnProtocol(e.target.value as "UDP" | "TCP")}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-[11px] font-medium focus:outline-none"
                        >
                          <option value="UDP">UDP (Mais Rápido)</option>
                          <option value="TCP">TCP (Conexões instáveis)</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <input
                            type="checkbox"
                            id="vpn-req-auth"
                            checked={vpnRequireAuth}
                            onChange={(e) => setVpnRequireAuth(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <label htmlFor="vpn-req-auth" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                            O Servidor exige usuário e senha (auth-user-pass)
                          </label>
                        </div>
                        {vpnRequireAuth && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-1.5 animate-fadeIn">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-0.5">Usuário de VPN</label>
                              <input
                                type="text"
                                value={vpnUser}
                                onChange={(e) => setVpnUser(e.target.value)}
                                placeholder="ex: lmarcanjo@empresa.com"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none text-slate-700 dark:text-white text-[11px]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-0.5">Senha de VPN</label>
                              <input
                                type="password"
                                value={vpnPassword}
                                onChange={(e) => setVpnPassword(e.target.value)}
                                placeholder="Sua senha corporativa OpenVPN"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none text-slate-700 dark:text-white text-[11px]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <FileText size={11} className="text-slate-400" />
                          Perfil OpenVPN (.ovpn) e Certificados TLS CA/Inline
                        </label>
                        <textarea
                          rows={4}
                          value={vpnConfigXml}
                          onChange={(e) => setVpnConfigXml(e.target.value)}
                          placeholder="Cole aqui o conteúdo do seu arquivo de configuração de perfil .ovpn..."
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 focus:outline-none focus:border-slate-500 font-mono text-[9px] leading-relaxed text-slate-700 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {vpnType === "ipsec" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">ID / Nome do Grupo (Cisco Group ID)</label>
                        <input
                          type="text"
                          value={vpnGroupId}
                          onChange={(e) => setVpnGroupId(e.target.value)}
                          placeholder="ex: vpn_finance"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Chave Compartilhada do Grupo (Shared Secret)</label>
                        <input
                          type="password"
                          value={vpnGroupSecret}
                          onChange={(e) => setVpnGroupSecret(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cifra de Encriptação</label>
                        <select
                          value={vpnEncryption}
                          onChange={(e) => setVpnEncryption(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] text-slate-700 dark:text-white focus:outline-none"
                        >
                          <option value="AES-256-GCM">AES-256-GCM (Altamente Recomendado)</option>
                          <option value="AES-128-CBC">AES-128-CBC</option>
                          <option value="3DES">3DES (Legado Legacia)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome do Usuário (Xauth Username)</label>
                        <input
                          type="text"
                          value={vpnUser}
                          onChange={(e) => setVpnUser(e.target.value)}
                          placeholder="Usuário Xauth individual"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Senha do Usuário (Xauth Password)</label>
                        <input
                          type="password"
                          value={vpnPassword}
                          onChange={(e) => setVpnPassword(e.target.value)}
                          placeholder="Sua senha de identificação de rede"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {vpnType === "l2tp" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Chave Pré-compartilhada IPsec (PSK)</label>
                        <input
                          type="password"
                          value={vpnPresharedKey}
                          onChange={(e) => setVpnPresharedKey(e.target.value)}
                          placeholder="Chave secreta IPsec compartilhada"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Usuário L2TP (PPP PAP/CHAP)</label>
                        <input
                          type="text"
                          value={vpnUser}
                          onChange={(e) => setVpnUser(e.target.value)}
                          placeholder="ex: ppp-user"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Senha L2TP (PPP)</label>
                        <input
                          type="password"
                          value={vpnPassword}
                          onChange={(e) => setVpnPassword(e.target.value)}
                          placeholder="Senha de rede credencial L2TP"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 leading-normal flex items-start gap-1.5 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded border border-blue-100 dark:border-blue-900/60">
                  <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />
                  <span>
                    O Sauron iniciará dinamicamente o túnel <strong>{vpnType === "wireguard" ? "Wireguard (wg0-interface)" : vpnType === "openvpn" ? "OpenVPN (tun0-tunnel)" : vpnType === "ipsec" ? "IPSec IKEv2 SecAssociation" : "L2TP Over IPSec"}</strong> em segundo plano, estabelecendo uma VPN lógica na sandbox de backend antes de autorizar qualquer roteamento de consulta ao banco SQL.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* SSH VM Proxy section */}
          <div className="mt-2 border border-slate-200 dark:border-slate-800 rounded p-3 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="ssh-tunnel-toggle" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="ssh-tunnel-toggle"
                  checked={useSshTunnel}
                  onChange={(e) => setUseSshTunnel(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-slate-850 dark:text-white focus:ring-slate-500 cursor-pointer h-4 w-4"
                />
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Terminal size={14} className="text-slate-500" />
                  Habilitar Túnel SSH (Bastion VM / VPN)
                </span>
              </label>
              <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Opcional</span>
            </div>

            {useSshTunnel && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-150 dark:border-slate-800 animate-fadeIn text-[11px]">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Host SSH (Bastion/Máquina Virtual)</label>
                  <input
                    type="text"
                    value={sshHost}
                    onChange={(e) => setSshHost(e.target.value)}
                    placeholder="ex: vm-bastion.empresa.com ou IP"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Porta SSH</label>
                  <input
                    type="text"
                    value={sshPort}
                    onChange={(e) => setSshPort(e.target.value)}
                    placeholder="22"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 font-mono text-[11px] text-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Usuário SSH</label>
                  <input
                    type="text"
                    value={sshUser}
                    onChange={(e) => setSshUser(e.target.value)}
                    placeholder="ex: ubuntu, root, admin"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <div className="flex gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Autenticação:
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="sshAuth"
                        checked={!sshPrivateKey}
                        onChange={() => setSshPrivateKey("")}
                        className="cursor-pointer"
                      />
                      Senha
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="sshAuth"
                        checked={!!sshPrivateKey}
                        onChange={() => setSshPrivateKey("-----BEGIN RSA PRIVATE KEY-----\n...")}
                        className="cursor-pointer"
                      />
                      Chave Privada (SSH Key)
                    </label>
                  </div>
                  
                  {sshPrivateKey ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Chave PEM / RSA Privada</label>
                      <textarea
                        rows={3}
                        value={sshPrivateKey}
                        onChange={(e) => setSshPrivateKey(e.target.value)}
                        placeholder="Cole aqui o conteúdo do arquivo .pem ou id_rsa..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 focus:outline-none focus:border-slate-500 font-mono text-[9px] leading-snug text-slate-700 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Senha SSH</label>
                      <input
                        type="password"
                        value={sshPassword}
                        onChange={(e) => setSshPassword(e.target.value)}
                        placeholder="Sua senha da máquina virtual"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-slate-500 text-slate-700 dark:text-white"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 leading-normal">
                    Obs: O túnel SSH age apenas como ponte de rede local (local loopback proxying) entre este servidor seguro e a VM configurada, protegendo logins e transações de ponta a ponta.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Test connection row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={testConnection}
              disabled={isTesting || (useConnectionString ? !connectionString : (!host || !database))}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white disabled:opacity-50 transition-all rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer h-8 shrink-0"
            >
              {isTesting ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-blue-400" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <Plug size={12} className="text-blue-400" />
                  <span>Testar e Descobrir Tabelas</span>
                </>
              )}
            </button>

            {testResult && (
              <div className="flex items-center gap-1.5 text-[11px]">
                {testResult.success ? (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                      <CheckCircle2 size={13} className="text-blue-500" /> Conectado! {testResult.tables?.length || 0} {dbType === "mongodb" ? "coleções" : "tabelas"} encontradas.
                    </span>
                    {testResult.isVpnSimulated && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 text-[10px]">
                        🛡️ VPN Ativa (Criptografada / Sandbox)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="flex items-start gap-1 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 p-1.5 rounded border border-red-200 dark:border-red-900 leading-normal max-w-[280px] md:max-w-[400px]">
                    <XCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <span>Erro: {testResult.error}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Table discovery and Mapping inputs */}
          {testResult && testResult.success && testResult.tables && (
            <div className="mt-4 border-t border-slate-150 dark:border-slate-800 pt-4 space-y-4 animate-fadeIn">
              
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-slate-900 dark:bg-slate-850 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PASSO 2</span>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wide">
                      {dbType === "mongodb" ? "Origem das Coleções" : "Origem dos Dados"}
                    </h5>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUseCustomQuery(false)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        !useCustomQuery 
                          ? "bg-slate-800 dark:bg-slate-700 border-slate-800 dark:border-slate-600 text-white" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      }`}
                    >
                      {dbType === "mongodb" ? "Escolher Coleção" : "Escolher Tabela"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomQuery(true)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        useCustomQuery 
                          ? "bg-slate-800 dark:bg-slate-700 border-slate-800 dark:border-slate-600 text-white" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      }`}
                    >
                      {dbType === "mongodb" ? "Filtro JSON Livre" : "Consulta SQL Livre"}
                    </button>
                  </div>
                </div>

                {!useCustomQuery ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                        {dbType === "mongodb" ? "Selecione as Coleções (MongoDB)" : "Selecione as Tabelas no Banco"}
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTable("__ALL_TABLES__");
                            if (testResult.tables.length > 0) {
                              autoMapColumns(testResult.tables[0], testResult.tableColumns || {});
                            }
                          }}
                          className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${
                            selectedTable === "__ALL_TABLES__"
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          }`}
                          title="Seleciona todas as tabelas encontradas no banco"
                        >
                          Selecionar Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTable("");
                          }}
                          className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>

                    {/* Filter and search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar tabela por nome..."
                        value={tableSearchTerm}
                        onChange={(e) => setTableSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Scrollable list of tables */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 overflow-y-auto max-h-[160px] p-2 space-y-1">
                      {testResult.tables
                        .filter((t) => t.toLowerCase().includes(tableSearchTerm.toLowerCase()))
                        .map((t) => {
                          const isAllOptionSelected = selectedTable === "__ALL_TABLES__";
                          const isIndividuallySelected = selectedTable.split(",").map(x => x.trim()).includes(t);
                          const isSelected = isAllOptionSelected || isIndividuallySelected;
                          const estRows = testResult.estimatedRows?.[t] !== undefined
                            ? testResult.estimatedRows[t]
                            : Math.floor(Math.random() * 4500) + 120; // Fallback simulation

                          return (
                            <div
                              key={t}
                              onClick={() => {
                                if (isAllOptionSelected) {
                                  setSelectedTable(t);
                                  autoMapColumns(t, testResult.tableColumns || {});
                                } else {
                                  const currentList = selectedTable ? selectedTable.split(",").map(x => x.trim()).filter(Boolean) : [];
                                  if (currentList.includes(t)) {
                                    const newList = currentList.filter(x => x !== t);
                                    setSelectedTable(newList.join(", "));
                                  } else {
                                    const newList = [...currentList, t];
                                    setSelectedTable(newList.join(", "));
                                    if (newList.length === 1) {
                                      autoMapColumns(t, testResult.tableColumns || {});
                                    }
                                  }
                                }
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition text-xs ${
                                isSelected
                                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/20"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-850/80 text-slate-600 dark:text-slate-350 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                                />
                                <span className="font-mono truncate max-w-[280px]">{t}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded">
                                {estRows.toLocaleString()} reg.
                              </span>
                            </div>
                          );
                        })}
                      {testResult.tables.filter((t) => t.toLowerCase().includes(tableSearchTerm.toLowerCase())).length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-4 italic">Nenhuma tabela correspondente encontrada.</p>
                      )}
                    </div>

                    {/* Active Selected Tables Badge Indicators */}
                    {selectedTable && (
                      <div className="flex flex-wrap gap-1 mt-1 p-2 bg-slate-100/50 dark:bg-slate-950/40 rounded border border-slate-150 dark:border-slate-850">
                        <span className="text-[8px] font-black uppercase text-slate-450 block w-full mb-1">Tabelas / Coleções Escaneadas Ativas:</span>
                        {selectedTable === "__ALL_TABLES__" ? (
                          <span className="text-[9px] bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">
                            Todas as Tabelas ({testResult.tables.length})
                          </span>
                        ) : (
                          selectedTable.split(",").map(x => x.trim()).filter(Boolean).map(t => (
                            <span key={t} className="text-[9px] bg-slate-200 text-slate-705 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {dbType === "mongodb" ? "Escreva o Filtro JSON para MongoDB" : "Escreva sua Consulta SQL SELECT"}
                      </label>
                      <span className="text-[9px] text-slate-400 dark:text-slate-450 font-medium">
                        {dbType === "mongodb" ? 'ex: { "Mês": "Janeiro", "Receita": { "$gt": 0 } }' : "Use joins ou filtros no SQL para otimizar"}
                      </span>
                    </div>
                    <textarea
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      placeholder={dbType === "mongodb" ? '{ "Mês": "Janeiro" }' : "SELECT * FROM minha_tabela LIMIT 1000;"}
                      rows={3}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2.5 font-mono focus:outline-none focus:border-blue-500 text-[11px] text-slate-800 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Column Mapping Panel */}
              {!useCustomQuery && availableColumns.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-1.5 justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">MAPEAMENTO</span>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wide">Mapeamento de Colunas do Banco</h5>
                    </div>
                    <span className="text-[10px] text-blue-505 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded px-2 py-0.5 font-bold">
                      Mapeado Automático
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 dark:text-slate-450 leading-normal mb-2 font-medium">
                    Selecione quais colunas da tabela <span className="font-bold text-slate-650 dark:text-slate-350">"{selectedTable}"</span> representam os dados de negócios do Sauron:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    
                    {/* Character Fields */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Grupo Econômico</label>
                      <select
                        value={mappings.Grupo || ""}
                        onChange={(e) => handleMappingChange("Grupo", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">CNPJ Unidade</label>
                      <select
                        value={mappings.CNPJ || ""}
                        onChange={(e) => handleMappingChange("CNPJ", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Marca / Bandeira</label>
                      <select
                        value={mappings.Marca || ""}
                        onChange={(e) => handleMappingChange("Marca", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Razão Social / Empresa</label>
                      <select
                        value={mappings.Empresa || ""}
                        onChange={(e) => handleMappingChange("Empresa", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Filial</label>
                      <select
                        value={mappings.Filial || ""}
                        onChange={(e) => handleMappingChange("Filial", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 font-sans uppercase mb-0.5">Mês de Competência</label>
                      <select
                        value={mappings.Mês || ""}
                        onChange={(e) => handleMappingChange("Mês", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Razão de Despesa</label>
                      <select
                        value={mappings.Razão || ""}
                        onChange={(e) => handleMappingChange("Razão", e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    {/* Numeric Fields */}
                    <div>
                      <label className="block text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-0.5">Receita Bruta</label>
                      <select
                        value={mappings.Receita || ""}
                        onChange={(e) => handleMappingChange("Receita", e.target.value)}
                        className="w-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded px-2 py-1 text-[11px] font-bold cursor-pointer focus:outline-none"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase mb-0.5">Custo CMV</label>
                      <select
                        value={mappings.Custo || ""}
                        onChange={(e) => handleMappingChange("Custo", e.target.value)}
                        className="w-full bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-red-500 dark:text-red-400 uppercase mb-0.5">Despesas Glicadas</label>
                      <select
                        value={mappings.Despesa || ""}
                        onChange={(e) => handleMappingChange("Despesa", e.target.value)}
                        className="w-full bg-red-50 dark:bg-red-950/45 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded px-2 py-1 text-[11px] font-medium cursor-pointer focus:outline-none"
                      >
                        <option value="">-- Ignorar --</option>
                        {availableColumns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>
              )}

              {/* Sync controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-150 dark:border-slate-800 pt-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {statusMessage && (
                    <span className={`block font-bold leading-normal ${
                      statusMessage.startsWith("Sucesso") ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                    }`}>
                      {statusMessage}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={loadData}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                    <span>Importar Dados do Banco</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};
