import React from 'react';
import { 
  BarChart3, Database, Presentation, MonitorPlay, Users, Store, Tag, Calculator, Target,
  FileText, Award, BookMarked, ShieldAlert, Settings, BrainCircuit, ChevronRight
} from 'lucide-react';

export const AppSidebar = ({ activePage, setActivePage, activeIndustryTemplateId = "automotive" }: { activePage: string, setActivePage: (p: string) => void, activeIndustryTemplateId?: string }) => {
  const isAutomotive = activeIndustryTemplateId === "automotive";
  
  const menuItems = [
    { title: "Dashboard Executivo", id: "resumo", icon: BarChart3 },
    { title: "DRE Inteligente Gerencial", id: "dre_inteligente", icon: Calculator },
    { title: "Contábil & Filiais", id: "contabil", icon: Database },
    { title: "Importação de Arquivos", id: "importacao", icon: Database },
    { title: "Fechamento Mensal", id: "fechamento_mensal", icon: Calculator },
    { title: "VPN Gateway", id: "vpn_gateway", icon: ShieldAlert },
    { title: "Apresentações", id: "apresentacoes", icon: Presentation },
    { title: "Modo Reunião", id: "modo_reuniao", icon: MonitorPlay },
    { title: "Consultor IA", id: "consultor_ia", icon: BrainCircuit },
    { 
      title: "Análise Comercial e Operação", 
      id: "analise_comercial",
      subItems: [
        { title: "Comercial e Vendas", id: "comercial", icon: Store },
        { title: "Vendedores", id: "vendedores", icon: Users },
        { title: "Comissões", id: "comissoes", icon: Calculator },
        // Conditional specific items
        ...(isAutomotive ? [
          { title: "Pós-Vendas (Oficina)", id: "posvendas", icon: Target },
          { title: "Peças & Acessórios", id: "pecas", icon: Target },
          { title: "Gestão de Estoque", id: "estoque", icon: Target },
        ] : [])
      ]
    },
    { 
      title: "Controladoria", 
      id: "controladoria",
      subItems: [
        { title: "Financeiro & Tesouraria", id: "financeiro", icon: Calculator },
      ]
    },
    { title: "Modelo Consultivo", id: "modelo_consultivo", icon: FileText },
    { title: "Área do Consultor", id: "area_consultor", icon: Award },
    { title: "Diag. Obstáculos", id: "obstaculos", icon: ShieldAlert },
    { title: "Configurações", id: "perfis", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-50">
      <div className="p-4 flex items-center gap-2 border-b border-slate-800 shrink-0 h-[68px]">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
          S
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm">Sauron OS</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Consultor BI Agent</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1 px-3">
          {menuItems.map((item, idx) => (
            <li key={item.id || `group-${idx}`}>
              {item.subItems ? (
                <div className="mt-4 mb-1">
                  <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.title}</span>
                  <ul className="mt-1 space-y-1">
                    {item.subItems.map(sub => (
                      <li key={sub.id}>
                        <button
                          onClick={() => setActivePage(sub.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                            activePage === sub.id ? "bg-blue-600/10 text-blue-400" : "hover:bg-slate-800"
                          }`}
                        >
                          <sub.icon size={14} />
                          {sub.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <button
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    activePage === item.id ? "bg-blue-600/10 text-blue-400" : "hover:bg-slate-800"
                  }`}
                >
                  <item.icon size={14} />
                  {item.title}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-slate-800 text-center shrink-0">
        <span className="text-[10px] font-mono text-slate-600">v2.0.0-rc1</span>
      </div>
    </aside>
  );
};
