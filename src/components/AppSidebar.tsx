import React from 'react';
import { 
  BarChart3, Database, Presentation, MonitorPlay, Users, Store, Tag, Calculator, Target,
  FileText, Award, BookMarked, ShieldAlert, Settings, BrainCircuit, ChevronRight, ChevronLeft, Menu,
  Briefcase
} from 'lucide-react';

export const AppSidebar = ({ 
  activePage, 
  setActivePage, 
  activeIndustryTemplateId = "automotive",
  isMobileOpen,
  setIsMobileOpen,
  isDesktopCollapsed,
  setIsDesktopCollapsed
}: { 
  activePage: string, 
  setActivePage: (p: string) => void, 
  activeIndustryTemplateId?: string,
  isMobileOpen: boolean,
  setIsMobileOpen: (v: boolean) => void,
  isDesktopCollapsed: boolean,
  setIsDesktopCollapsed: (v: boolean) => void
}) => {
  const isAutomotive = activeIndustryTemplateId === "automotive";
  
  const menuItems = [
    { title: "Workspace Executivo", id: "executive_workspace", icon: Briefcase },
    { title: "Dashboard Executivo", id: "resumo", icon: BarChart3 },
    { title: "Relatórios Corporativos", id: "relatorios", icon: BookMarked },
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
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-50 transition-all duration-300 ${
        isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
      } ${isDesktopCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        
        <div className="p-4 flex flex-row items-center justify-between border-b border-slate-800 shrink-0 h-[68px]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              S
            </div>
            {!isDesktopCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="font-bold text-white text-sm">Sauron OS</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Consultor BI</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isDesktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar overflow-x-hidden">
          <ul className="space-y-1 px-2.5">
            {menuItems.map((item, idx) => (
              <li key={item.id || `group-${idx}`}>
                {item.subItems ? (
                  <div className="mt-4 mb-1">
                    {!isDesktopCollapsed && <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate block">{item.title}</span>}
                    {isDesktopCollapsed && <div className="w-full h-px bg-slate-800 my-2" />}
                    <ul className="mt-1 space-y-1">
                      {item.subItems.map(sub => (
                        <li key={sub.id}>
                          <button
                            onClick={() => {
                              setActivePage(sub.id);
                              if (window.innerWidth < 1024) setIsMobileOpen(false);
                            }}
                            title={isDesktopCollapsed ? sub.title : undefined}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                              activePage === sub.id ? "bg-blue-600/10 text-blue-400" : "hover:bg-slate-800"
                            } ${isDesktopCollapsed ? "justify-center" : "justify-start"}`}
                          >
                            <sub.icon size={isDesktopCollapsed ? 18 : 14} className="shrink-0" />
                            {!isDesktopCollapsed && <span>{sub.title}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActivePage(item.id);
                      if (window.innerWidth < 1024) setIsMobileOpen(false);
                    }}
                    title={isDesktopCollapsed ? item.title : undefined}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      activePage === item.id ? "bg-blue-600/10 text-blue-400" : "hover:bg-slate-800"
                    } ${isDesktopCollapsed ? "justify-center" : "justify-start"}`}
                  >
                    <item.icon size={isDesktopCollapsed ? 18 : 14} className="shrink-0" />
                    {!isDesktopCollapsed && <span>{item.title}</span>}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {!isDesktopCollapsed && (
          <div className="p-4 border-t border-slate-800 text-center shrink-0">
            <span className="text-[10px] font-mono text-slate-600">v2.0.0-rc1</span>
          </div>
        )}
      </aside>
    </>
  );
};

