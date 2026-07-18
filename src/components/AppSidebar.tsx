/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ShieldAlert, Layers, Lock, History, Settings
} from 'lucide-react';
import { adaptiveNavigationEngine } from "../core/adaptive-ui";
import { getConsultingFlowStructure } from '../core/navigation/consultingFlowStructure';
import { getModuleCapabilityState, shouldExposeModule } from '../core/navigation/moduleCapabilities';

interface SidebarProps {
  activePage: string;
  setActivePage: (p: string) => void;
  activeIndustryTemplateId?: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (v: boolean) => void;
  userRole?: string;
  hasActiveDataset?: boolean;
}

const AppSidebarContent: React.FC<SidebarProps> = ({ 
  activePage, 
  setActivePage, 
  activeIndustryTemplateId = "neutral",
  isMobileOpen,
  setIsMobileOpen,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  userRole = "SUPER_ADMIN",
  hasActiveDataset = false,
}) => {
  const [dictionaryTick, setDictionaryTick] = useState(0);

  React.useEffect(() => {
    const handleUpdate = () => {
      setDictionaryTick(t => t + 1);
    };
    window.addEventListener("sauron:dictionary-updated", handleUpdate);
    return () => window.removeEventListener("sauron:dictionary-updated", handleUpdate);
  }, []);

  const menuOptions = {
    domainId: activeIndustryTemplateId,
    capabilities: Object.fromEntries(
      getConsultingFlowStructure({ domainId: activeIndustryTemplateId })
        .flatMap(group => group.subItems)
        .map(item => [item.id, getModuleCapabilityState(item.id, { hasActiveDataset, permissionGranted: true })])
    ),
  };

  // Accordion states — auto-expand the group that contains the active page
  const getInitialExpanded = () => {
    const structure = getConsultingFlowStructure(menuOptions);
    const expanded: Record<string, boolean> = {};
    for (const group of structure) {
      expanded[group.groupKey] = true;
    }
    return expanded;
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(getInitialExpanded);

  // Auto-expand group when active page changes
  React.useEffect(() => {
    const structure = getConsultingFlowStructure(menuOptions);
    for (const group of structure) {
      if (group.subItems.some(s => s.id === activePage)) {
        setExpandedGroups(prev => ({ ...prev, [group.groupKey]: true }));
        break;
      }
    }
  }, [activePage, activeIndustryTemplateId]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Helper to determine if user role has access to a group
  const hasGroupAccess = (groupKey: string): boolean => {
    const role = userRole || "SUPER_ADMIN";
    if (role === "SUPER_ADMIN") return true;
    if (role === "CONSULTANT") {
      return groupKey !== "administracao";
    }
    return true;
  };

  // Helper to determine if user role has access to a sub-item
  const hasSubItemAccess = (groupKey: string, subId: string): boolean => {
    const role = userRole || "SUPER_ADMIN";
    if (role === "SUPER_ADMIN") return true;
    if (role === "CONSULTANT") {
      return groupKey !== "administracao";
    }
    return true;
  };

  // Build adapted menu structure
  const consultingFlowStructure = adaptiveNavigationEngine.adaptMenuStructure(getConsultingFlowStructure(menuOptions));

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        role="navigation"
        aria-label="Menu principal de navegação"
        className={`bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-50 transition-all duration-300 ${
        isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
      } ${isDesktopCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        
        {/* Header Area */}
        <div className="p-4 flex flex-row items-center justify-between border-b border-slate-800 shrink-0 h-[68px]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              S
            </div>
            {!isDesktopCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="font-extrabold text-white text-sm tracking-tight">Sauron OS</span>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Consulting OS</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            aria-label={isDesktopCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {isDesktopCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
          </button>
        </div>

        {/* Navigation List — 9 Fluxos Consultivos em Acordeão */}
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar overflow-x-hidden px-2 space-y-0.5">
          {consultingFlowStructure
            .filter(group => hasGroupAccess(group.groupKey))
            .map((group) => {
              const GroupIcon = group.icon;
              const isGroupExpanded = expandedGroups[group.groupKey] ?? false;
              const accessibleSubItems = group.subItems.filter(sub =>
                hasSubItemAccess(group.groupKey, sub.id) && shouldExposeModule(sub.availability || "AVAILABLE")
              );
              const isGroupActive = accessibleSubItems.some(s => s.id === activePage);

              if (isDesktopCollapsed) {
                // Collapsed: show only icons with tooltip
                return (
                  <div key={group.groupKey} className="space-y-0.5">
                    {accessibleSubItems.slice(0, 1).map(sub => {
                      const SubIcon = sub.icon;
                      const isActive = activePage === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActivePage(sub.id);
                            if (window.innerWidth < 1024) setIsMobileOpen(false);
                          }}
                          title={`${group.title}: ${sub.title}`}
                          className={`w-full flex justify-center py-2.5 rounded-lg transition-colors cursor-pointer ${
                            isActive
                              ? "bg-blue-600/20 text-blue-400"
                              : "hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <SubIcon size={18} />
                        </button>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div key={group.groupKey} className="space-y-0">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.groupKey)}
                    aria-expanded={isGroupExpanded}
                    aria-controls={`sidebar-group-${group.groupKey}`}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                      isGroupActive
                        ? "text-blue-400 bg-blue-600/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <GroupIcon size={14} className="shrink-0" aria-hidden="true" />
                    <span className="flex-1 text-left truncate">{group.title}</span>
                    {isGroupExpanded
                      ? <ChevronUp size={12} className="shrink-0 opacity-60" aria-hidden="true" />
                      : <ChevronDown size={12} className="shrink-0 opacity-40" aria-hidden="true" />
                    }
                  </button>

                  {/* Sub-items — sempre no DOM para aria-controls válido */}
                  <div
                    id={`sidebar-group-${group.groupKey}`}
                    hidden={!isGroupExpanded}
                    className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 mb-1"
                  >
                    {accessibleSubItems.map(sub => {
                      const SubIcon = sub.icon;
                      const isActive = activePage === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActivePage(sub.id);
                            if (window.innerWidth < 1024) setIsMobileOpen(false);
                          }}
                          data-testid={sub.id === "importacao" ? "btn-open-data-center" : undefined}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                            isActive
                              ? "bg-blue-600/15 text-blue-400 font-extrabold border-l-2 border-blue-500 -ml-px pl-[9px] rounded-l-none"
                              : "hover:bg-slate-800/60 text-slate-300 hover:text-slate-100"
                          }`}
                        >
                          <SubIcon size={13} className="shrink-0 opacity-80" aria-hidden="true" />
                          <span className="truncate">{sub.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* Super Admin extras */}
          {userRole === "SUPER_ADMIN" && !isDesktopCollapsed && (
            <div className="mt-2 pt-2 border-t border-slate-800 space-y-0.5">
              {typeof window !== "undefined" && window.location.search.includes("qa=true") && (
                <button
                  onClick={() => setActivePage("qa_console")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activePage === "qa_console"
                      ? "bg-blue-600/15 text-blue-400 font-extrabold"
                      : "hover:bg-slate-800/60 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <ShieldAlert size={13} />
                  <span>Product QA Console</span>
                </button>
              )}
              {typeof window !== "undefined" && window.location.search.includes("lab=true") && (
                <button
                  onClick={() => setActivePage("sdl_studio")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activePage === "sdl_studio"
                      ? "bg-blue-600/15 text-blue-400 font-extrabold"
                      : "hover:bg-slate-800/60 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Layers size={13} />
                  <span>SDL Studio</span>
                </button>
              )}
            </div>
          )}
        </div>
        
        {!isDesktopCollapsed && (
          <div className="p-4 border-t border-slate-800 text-center shrink-0">
            <span className="text-[9px] font-mono text-slate-400 tracking-wider" aria-hidden="true">SAURON OS v0.6.8</span>
          </div>
        )}
      </aside>
    </>
  );
};

class SidebarErrorBoundary extends React.Component<
  { children: React.ReactNode; setActivePage: (p: string) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[SidebarErrorBoundary] Catastrophic sidebar error intercepted:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <aside className="bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-350 z-50 w-64">
          <div className="p-4 flex flex-row items-center border-b border-slate-800 shrink-0 h-[68px]">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold mr-2">S</div>
            <span className="font-extrabold text-white text-sm">Sauron OS</span>
          </div>
          <div className="flex-1 p-4 space-y-2 text-left">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4">
              <p className="text-[10px] text-rose-400 font-bold leading-normal">
                Ocorreu um erro ao carregar a interface personalizada. Exibindo menu de segurança.
              </p>
            </div>
            <button
              onClick={() => this.props.setActivePage("enterprise_center")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              <Building size={14} className="mr-2" /> Empresas e Grupos
            </button>
            <button
              onClick={() => this.props.setActivePage("perfis")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              <Settings size={14} className="mr-2" /> Configurações
            </button>
          </div>
        </aside>
      );
    }

    return this.props.children;
  }
}

export const AppSidebar: React.FC<SidebarProps> = (props) => {
  return (
    <SidebarErrorBoundary setActivePage={props.setActivePage}>
      <AppSidebarContent {...props} />
    </SidebarErrorBoundary>
  );
};
