import React, { useState, useEffect } from 'react';
import { Network, Server, Shield, Key, AlertTriangle, Play, Square, Activity, Database, Terminal } from 'lucide-react';

interface VpnConfig {
  id: string;
  clientName: string;
  vpnType: "openvpn" | "wireguard" | "ipsec";
  ovpnContent: string;
  dbHost: string;
  dbPort: string;
  dbType: string;
  dbUser?: string;
  status: "disconnected" | "connecting" | "connected" | "error";
  containerId?: string;
  logs: string[];
}

export const VpnGatewayTab = () => {
  const [configs, setConfigs] = useState<VpnConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // New config state
  const [clientName, setClientName] = useState("");
  const [vpnType, setVpnType] = useState<"openvpn" | "wireguard" | "ipsec">("openvpn");
  const [ovpnContent, setOvpnContent] = useState("");
  const [vpnUser, setVpnUser] = useState("");
  const [vpnPass, setVpnPass] = useState("");
  const [dbHost, setDbHost] = useState("");
  const [dbPort, setDbPort] = useState("5432");
  const [dbType, setDbType] = useState("postgres");
  const [dbUser, setDbUser] = useState("");

  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/vpn/list");
      const data = await res.json();
      if (data.success) {
        setConfigs(data.configs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/vpn/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName, vpnType, ovpnContent, vpnUser, vpnPass, dbHost, dbPort, dbType, dbUser
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAdding(false);
        fetchConfigs();
        setClientName("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleConnection = async (id: string, currentStatus: string) => {
    const action = currentStatus === "connected" || currentStatus === "connecting" ? "disconnect" : "connect";
    
    // Optimistic UI update to 'connecting'
    if (action === "connect") {
       setConfigs(configs.map(c => c.id === id ? { ...c, status: "connecting" } : c));
    }

    try {
      const res = await fetch(`/api/vpn/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        fetchConfigs();
      }
    } catch (e) {
      console.error(e);
      fetchConfigs();
    }
  };

  const testDbConnection = async (id: string) => {
    setTestResult(`[Testando] Validando conexão read-only com banco do cliente...`);
    try {
      const res = await fetch(`/api/vpn/test-db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(`[Sucesso] Conectado ao banco. Privilégios: READ-ONLY. Alterações bloqueadas.`);
      } else {
        setTestResult(`[Erro] ${data.error}`);
      }
    } catch (e: any) {
      setTestResult(`[Erro] Falha ao testar conexão: ${e.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Network size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sauron VPN Gateway</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Isolamento de Redes Cliente-a-Cliente. Containers Docker Dedicados (Read-Only DB Access).
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {isAdding ? "Cancelar Configuração" : "+ Nova Conexão Cliente"}
        </button>
      </div>

      <div className="flex gap-4 p-4 text-sm bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg text-orange-800 dark:text-orange-300 items-start">
        <Shield className="shrink-0 mt-0.5" size={18} />
        <div>
          <strong>Política de Segurança Obrigatória</strong>
          <ul className="list-disc ml-5 mt-1 opacity-90 space-y-1">
            <li>As credenciais são armazenadas criptografadas e não são expostas ao frontend.</li>
            <li>O acesso ao banco de dados usa um driver que força modo Read-Only, interceptando queries que contenham CREATE, DROP, DELETE, UPDATE, ALTER, INSERT, TRUNCATE.</li>
            <li>As conexões acontecem em sub-redes Docker isoladas por cliente, evitando route leaking.</li>
          </ul>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddConfig} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cadastrar VPN do Cliente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <label className="block font-medium text-slate-700 dark:text-slate-300">Apelido do Cliente / Corporação</label>
              <input required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100" placeholder="ex: Grupo Alpha Leste" />
            </div>
            
            <div className="space-y-2 text-sm">
              <label className="block font-medium text-slate-700 dark:text-slate-300">Tecnologia VPN</label>
              <select value={vpnType} onChange={e => setVpnType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100">
                <option value="openvpn">OpenVPN Client (.ovpn)</option>
                <option value="wireguard">WireGuard (.conf)</option>
                <option value="ipsec">IPSec / L2TP</option>
              </select>
            </div>

            <div className="space-y-2 text-sm md:col-span-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300">Conteúdo do Arquivo de Configuração (.ovpn / .conf)</label>
              <textarea required value={ovpnContent} onChange={e => setOvpnContent(e.target.value)} className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono text-xs custom-scrollbar" placeholder="Cole o conteúdo do arquivo VPN aqui..." />
            </div>

            <div className="space-y-2 text-sm">
              <label className="block font-medium text-slate-700 dark:text-slate-300">Usuário VPN (opcional)</label>
              <input value={vpnUser} onChange={e => setVpnUser(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100" />
            </div>

            <div className="space-y-2 text-sm">
              <label className="block font-medium text-slate-700 dark:text-slate-300">Senha VPN (opcional)</label>
              <input type="password" value={vpnPass} onChange={e => setVpnPass(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100" />
            </div>

            <div className="space-y-2 text-sm">
              <label className="block font-medium text-slate-700 dark:text-slate-300">Host Interno do Banco</label>
              <input required value={dbHost} onChange={e => setDbHost(e.target.value)} placeholder="192.168.1.50 ou 10.0.0.10" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <label className="block font-medium text-slate-700 dark:text-slate-300">Porta</label>
                <input required value={dbPort} onChange={e => setDbPort(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono" />
              </div>
              <div className="space-y-2 text-sm">
                <label className="block font-medium text-slate-700 dark:text-slate-300">Motor do Banco</label>
                <select value={dbType} onChange={e => setDbType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100">
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="oracle">Oracle DB</option>
                  <option value="mssql">SQL Server</option>
                </select>
              </div>
            </div>
          </div>
          
          <button type="submit" className="w-full py-2 bg-slate-900 dark:bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition">
            Isolar Configuração e Salvar
          </button>
        </form>
      )}

      {testResult && (
        <div className="p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-lg border border-slate-800 whitespace-pre-wrap">
          {testResult}
        </div>
      )}

      <div className="space-y-4">
        {configs.map((config) => (
          <div key={config.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  config.status === 'connected' ? 'bg-green-500 animate-pulse' :
                  config.status === 'connecting' ? 'bg-amber-400 animate-bounce' :
                  config.status === 'error' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'
                }`} />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {config.clientName}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wide">
                      {config.vpnType}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Database size={12} /> {config.dbHost}:{config.dbPort}</span>
                    <span className="flex items-center gap-1"><Server size={12} /> Container ID: {config.containerId || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {config.status === "connected" && (
                  <button 
                    onClick={() => testDbConnection(config.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  >
                    <Activity size={14} /> Testar BD
                  </button>
                )}
                <button
                  onClick={() => toggleConnection(config.id, config.status)}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    config.status === 'connected' 
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border dark:border-rose-800' 
                      : config.status === 'connecting'
                      ? 'bg-amber-100 text-amber-700 opacity-50 cursor-not-allowed'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                  disabled={config.status === 'connecting'}
                >
                  {config.status === 'connected' ? <><Square size={12} /> Parar Container</> : 
                   config.status === 'connecting' ? 'Iniciando rede...' : 
                   <><Play size={12} fill="currentColor" /> Subir Container</>}
                </button>
              </div>
            </div>
            
            {(config.logs && config.logs.length > 0) && (
              <div className="bg-slate-950 p-4 text-[10px] sm:text-xs font-mono text-slate-400 max-h-48 overflow-y-auto">
                {config.logs.map((log, i) => (
                  <div key={i} className={log.toLowerCase().includes('error') ? 'text-rose-400' : log.toLowerCase().includes('success') || log.toLowerCase().includes('conectado') ? 'text-emerald-400' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {configs.length === 0 && !isAdding && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            Nenhuma VPN de cliente configurada.
          </div>
        )}
      </div>
    </div>
  );
};
