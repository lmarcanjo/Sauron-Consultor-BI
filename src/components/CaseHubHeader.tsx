/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Building, FolderPlus, X, PanelRightClose, PanelRight } from "lucide-react";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { DesignSystem } from "../design-system";
import { SauronButton } from "../sauron-sdk/ui/SauronButton";
import { SauronInput } from "../sauron-sdk/ui/SauronInput";
import { SauronSelect } from "../sauron-sdk/ui/SauronSelect";

interface CaseHubHeaderProps {
  projects: WorkspaceProject[];
  activeProject: WorkspaceProject | null;
  onSelectCase: (projectId: string) => void;
  isCreatingProject: boolean;
  setIsCreatingProject: (val: boolean) => void;
  newProjectName: string;
  setNewProjectName: (val: string) => void;
  newProjectGroup: string;
  setNewProjectGroup: (val: string) => void;
  newProjectSegment: string;
  setNewProjectSegment: (val: string) => void;
  handleCreateCase: (e: React.FormEvent) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (val: boolean) => void;
}

export const CaseHubHeader: React.FC<CaseHubHeaderProps> = ({
  projects,
  activeProject,
  onSelectCase,
  isCreatingProject,
  setIsCreatingProject,
  newProjectName,
  setNewProjectName,
  newProjectGroup,
  setNewProjectGroup,
  newProjectSegment,
  setNewProjectSegment,
  handleCreateCase,
  isPanelOpen,
  setIsPanelOpen,
}) => {
  return (
    <div className="space-y-4">
      {/* Active Case Selection */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl">
            <Building size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Centro de Comando do Projeto</span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={activeProject?.id || ""}
                onChange={(e) => onSelectCase(e.target.value)}
                className="bg-transparent font-extrabold text-lg text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.client} ({p.segment})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <SauronButton
            variant="filled"
            onClick={() => setIsCreatingProject(!isCreatingProject)}
            className="flex items-center gap-1.5"
          >
            <FolderPlus size={14} />
            <span>Novo Projeto</span>
          </SauronButton>
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            title={isPanelOpen ? "Fechar Painel" : "Abrir Painel"}
          >
            {isPanelOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
          </button>
        </div>
      </div>

      {/* Case Creation Drawer */}
      {isCreatingProject && (
        <form onSubmit={handleCreateCase} className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Inicializar Novo Projeto de Consultoria</h3>
            <button type="button" onClick={() => setIsCreatingProject(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Cliente</label>
              <SauronInput
                type="text"
                placeholder="Ex: Grupo Auto Líder"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Grupo Econômico</label>
              <SauronInput
                type="text"
                placeholder="Ex: Auto Líder S/A"
                value={newProjectGroup}
                onChange={(e) => setNewProjectGroup(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Segmento (DNA do Projeto)</label>
              <SauronSelect
                value={newProjectSegment}
                onChange={(e) => setNewProjectSegment(e.target.value)}
                options={[
                  { value: "Automotivo", label: "Automotivo" },
                  { value: "Agro", label: "Agro" },
                  { value: "Indústria", label: "Indústria" },
                  { value: "Serviços", label: "Serviços" }
                ]}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <SauronButton
              variant="ghost"
              onClick={() => setIsCreatingProject(false)}
            >
              Cancelar
            </SauronButton>
            <SauronButton type="submit" variant="filled">
              Inicializar Projeto
            </SauronButton>
          </div>
        </form>
      )}
    </div>
  );
};
