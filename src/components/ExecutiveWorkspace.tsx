/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Building, FolderPlus, Sparkles, SlidersHorizontal, Settings, HelpCircle, LayoutGrid, Check
} from "lucide-react";
import { DesignSystem } from "../design-system";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { layoutEngine } from "../core/layout/LayoutEngine";
import { widgetRegistry } from "../core/widgets/WidgetEngine";
import { identityEngine } from "../core/identity/IdentityEngine";
import { auditEngine } from "../core/audit/AuditEngine";

// Import widgets to trigger self-registration
import "./ExecutiveWidgets";

interface ExecutiveWorkspaceProps {
  filteredData: any[];
  activeFiles: any[];
  onSelectTab: (tabId: string) => void;
  formatCurrency: (value: number) => string;
}

export const ExecutiveWorkspace: React.FC<ExecutiveWorkspaceProps> = ({
  filteredData,
  activeFiles,
  onSelectTab,
  formatCurrency
}) => {
  // --- States ---
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [activePreset, setActivePreset] = useState<string>(layoutEngine.getActivePresetName());
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGroup, setNewProjectGroup] = useState("");
  const [newProjectSegment, setNewProjectSegment] = useState("");

  const currentUser = useMemo(() => identityEngine.getCurrentUser(), []);
  const currentOrg = useMemo(() => identityEngine.getCurrentOrganization(), []);

  // --- Dynamic Widget Context ---
  const widgetContext = useMemo(() => ({
    filteredData,
    activeFiles,
    formatCurrency,
    onSelectTab,
    activeProject,
    currentUser
  }), [filteredData, activeFiles, formatCurrency, onSelectTab, activeProject, currentUser]);

  // --- Load Workspace & Seed ---
  const loadWorkspace = async () => {
    let list = await consultantWorkspaceManager.listActiveProjects();
    if (list.length === 0) {
      const defaultProject = await consultantWorkspaceManager.createProject({
        client: "Grupo Comercial Alpha",
        group: "Grupo Alpha",
        segment: "Automotivo (Concessionárias)",
        companies: ["Alpha Nissan", "Alpha Renault"],
        brands: ["Nissan", "Renault"],
        cnpjs: ["00.123.456/0001-01"],
        dbConnections: [],
        spreadsheets: [],
        importProfile: null,
        filters: [],
        kpis: [],
        dashboards: [],
        presentations: [],
        actionPlans: [],
        observations: "Caso de consultoria padrão para o conselho exec.",
        history: [],
        auditLog: []
      });
      list = [defaultProject];
      await consultantWorkspaceManager.setActiveProject(defaultProject.id);
    }
    setProjects(list);
    const active = await consultantWorkspaceManager.getActiveProject();
    setActiveProject(active || list[0]);
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const handleSelectProject = async (projectId: string) => {
    await consultantWorkspaceManager.setActiveProject(projectId);
    const proj = projects.find(p => p.id === projectId) || null;
    setActiveProject(proj);
    auditEngine.logEvent("WORKSPACE_CHANGED", `Selecionou caso de consultoria ID: ${projectId}`, "INFO");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    const newProj = await consultantWorkspaceManager.createProject({
      client: newProjectName,
      group: newProjectGroup || "Grupo Geral",
      segment: newProjectSegment || "Geral",
      companies: [newProjectName],
      brands: [],
      cnpjs: [],
      dbConnections: [],
      spreadsheets: [],
      importProfile: null,
      filters: [],
      kpis: [],
      dashboards: [],
      presentations: [],
      actionPlans: [],
      observations: `Caso criado para ${newProjectName}.`,
      history: [],
      auditLog: []
    });

    setProjects(prev => [...prev, newProj]);
    setActiveProject(newProj);
    setIsCreatingProject(false);
    setNewProjectName("");
    setNewProjectGroup("");
    setNewProjectSegment("");
  };

  const handlePresetChange = (presetName: string) => {
    layoutEngine.setActivePreset(presetName);
    setActivePreset(presetName);
    auditEngine.logEvent("LAYOUT_CHANGED", `Alterou layout de visualização para: ${presetName}`, "INFO");
  };

  // --- Dynamic Grid Rendering of Enabled Widgets ---
  const activeLayout = useMemo(() => {
    return layoutEngine.getActiveLayout();
  }, [activePreset]);

  const renderedWidgets = useMemo(() => {
    return activeLayout.enabledWidgets.map(widgetId => {
      const widgetDef = widgetRegistry.getWidget(widgetId);
      if (!widgetDef) return null;

      const sizeClasses = {
        sm: "col-span-1",
        md: "col-span-1 md:col-span-1 lg:col-span-1",
        lg: "col-span-1 md:col-span-2 lg:col-span-2",
        full: "col-span-1 md:col-span-3 lg:col-span-3"
      };

      const WidgetComponent = widgetDef.component;

      return (
        <div key={widgetId} className={`${sizeClasses[widgetDef.defaultSize]} transition-all animate-fade-in`}>
          <WidgetComponent context={widgetContext} />
        </div>
      );
    }).filter(Boolean);
  }, [activeLayout, widgetContext]);

  return (
    <div className="space-y-6">
      {/* Dynamic Selector & Controller Bar */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Building size={18} />
          </div>
          <div>
            <p className={DesignSystem.Typography.caption}>Operating System de Consultoria</p>
            <select
              value={activeProject?.id || ""}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="bg-transparent font-extrabold text-sm text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer mt-0.5"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-950 text-slate-100">
                  {p.group} — {p.client}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Layout Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-extrabold uppercase mr-1">
            <LayoutGrid size={13} />
            <span>Layout:</span>
          </div>
          {layoutEngine.getAllPresets().map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetChange(preset.name)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border cursor-pointer ${
                activePreset === preset.name
                  ? "bg-blue-600 border-blue-700 text-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80"
              }`}
            >
              {preset.name}
            </button>
          ))}
          <button
            onClick={() => setIsCreatingProject(!isCreatingProject)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase rounded-lg border border-slate-250 dark:border-slate-700 cursor-pointer transition-all flex items-center gap-1"
          >
            <FolderPlus size={13} />
            <span>Novo Caso</span>
          </button>
        </div>
      </div>

      {/* Case Creation form */}
      {isCreatingProject && (
        <form onSubmit={handleCreateProject} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 animate-fade-in">
          <p className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Inicializar Novo Caso de Consultoria</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nome do Cliente"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className={DesignSystem.Input.text}
              required
            />
            <input
              type="text"
              placeholder="Grupo Econômico (ex: Grupo Alpha)"
              value={newProjectGroup}
              onChange={(e) => setNewProjectGroup(e.target.value)}
              className={DesignSystem.Input.text}
            />
            <input
              type="text"
              placeholder="Segmento Industrial"
              value={newProjectSegment}
              onChange={(e) => setNewProjectSegment(e.target.value)}
              className={DesignSystem.Input.text}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
              className="px-3 py-1.5 text-[10px] uppercase font-black text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
            <button type="submit" className={DesignSystem.Button.build("filled", "sm")}>
              Confirmar
            </button>
          </div>
        </form>
      )}

      {/* Executive Command Header */}
      <section className="bg-gradient-to-r from-blue-900/10 via-indigo-950/5 to-transparent border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-sans">
              Centro de Comando Executivo, <span className="text-blue-500 font-extrabold">{currentUser?.profile?.fullName || "Consultor"}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Caso de Consultoria: <strong className="text-slate-700 dark:text-slate-200">{activeProject?.client}</strong> ({activeProject?.segment}) • Organização: <strong className="text-slate-700 dark:text-slate-200">{currentOrg.name}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-[10px] font-mono text-blue-700 dark:text-blue-400 uppercase font-black tracking-wider">
            <Check size={12} className="text-blue-500 shrink-0" />
            Dados Atualizados
          </div>
        </div>
      </section>

      {/* Grid of Command Center Cockpit Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderedWidgets}
      </div>
    </div>
  );
};
