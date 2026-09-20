import React, { useState, useEffect, useMemo, useRef } from "react";
import { Folder, Building2, Briefcase, Plus, CheckCircle2, ChevronRight, Filter, Users, X, AlertCircle } from "lucide-react";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { BusinessGroup, Company, Unit } from "../core/persistence/EnterpriseRepository";
import { identityEngine } from "../core/identity/IdentityEngine";
import { auditEngine } from "../core/audit/AuditEngine";
import { ClientManagementModal } from "./ClientManagementModal";
import { EngagementModal } from "./EngagementModal";

interface PortfolioTabProps {
  onSelectEngagement?: (projectId: string) => void;
  onCreateNewEngagement?: () => void;
}

type OrganizationFormType = "Grupo" | "Empresa" | "Unidade";

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  onSelectEngagement,
  onCreateNewEngagement
}) => {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [groups, setGroups] = useState<BusinessGroup[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filterState, setFilterState] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState<boolean>(false);
  const [organizationFormType, setOrganizationFormType] = useState<OrganizationFormType>("Grupo");
  const [organizationParentId, setOrganizationParentId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationError, setOrganizationError] = useState<string | null>(null);

  const currentUser = identityEngine.getCurrentUser();
  const hasLoggedAccessEvent = useRef<boolean>(false);
  const loadDataRequestRef = useRef(0);
  const organizationLoadRequestRef = useRef(0);

  const loadData = async () => {
    const requestId = ++loadDataRequestRef.current;
    setLoading(true);
    try {
      // PortfolioService aplica a autorização por consultor
      const userProjects = await consultantWorkspaceManager.portfolioService.listProjects(currentUser);
      const activeProj = await consultantWorkspaceManager.portfolioService.getActiveProject(currentUser);
      if (requestId !== loadDataRequestRef.current) return;
      setProjects(userProjects);
      setActiveProjectId(activeProj?.id || null);
      setActiveProject(activeProj);
      await loadOrganizationStructure(activeProj?.id);

      // Emissão ÚNICA do evento oficial CARTEIRA_ACESSADA (evita re-emissão em re-renders)
      if (!hasLoggedAccessEvent.current) {
        hasLoggedAccessEvent.current = true;
        auditEngine.logEvent("CARTEIRA_ACESSADA", `Carteira acessada pelo consultor ${currentUser?.profile?.fullName || "Consultor"}`, "INFO", {
          user: currentUser?.profile?.fullName || currentUser?.id,
          count: userProjects.length
        });
      }
    } catch (e) {
      console.error("Erro ao carregar carteira:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationStructure = async (engagementId?: string) => {
    const requestId = ++organizationLoadRequestRef.current;
    if (!engagementId) {
      setGroups([]);
      setCompanies([]);
      setUnits([]);
      return;
    }
    const organizationService = consultantWorkspaceManager.organizationService;
    const nextGroups = await organizationService.listGroupsByEngagement(engagementId, currentUser);
    const nextCompanies: Company[] = [];
    const nextUnits: Unit[] = [];
    for (const group of nextGroups) {
      const groupCompanies = await organizationService.listCompaniesByGroup(group.id, currentUser);
      nextCompanies.push(...groupCompanies);
      for (const company of groupCompanies) {
        nextUnits.push(...await organizationService.listUnitsByCompany(company.id, currentUser));
      }
    }
    if (requestId !== organizationLoadRequestRef.current) return;
    setGroups(nextGroups);
    setCompanies(nextCompanies);
    setUnits(nextUnits);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSelectProject = async (projectId: string) => {
    try {
      await consultantWorkspaceManager.setActiveProject(projectId);
      setActiveProjectId(projectId);
      const project = await consultantWorkspaceManager.getActiveProject();
      setActiveProject(project);
      await loadOrganizationStructure(projectId);
      if (onSelectEngagement) {
        onSelectEngagement(projectId);
      }
    } catch (err: any) {
      alert(err.message || "Não foi possível selecionar o engajamento.");
    }
  };

  const handleEngagementCreated = async (engagement: WorkspaceProject) => {
    setIsEngagementModalOpen(false);
    await consultantWorkspaceManager.setActiveProject(engagement.id);
    setActiveProjectId(engagement.id);
    setActiveProject(engagement);
    await loadData();
    await loadOrganizationStructure(engagement.id);
  };

  const handleCreateOrganization = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeProject || !organizationName.trim()) return;
    setOrganizationError(null);
    try {
      const service = consultantWorkspaceManager.organizationService;
      if (organizationFormType === "Grupo") {
        await service.createGroup({ engagementId: activeProject.id, name: organizationName }, currentUser);
      } else if (organizationFormType === "Empresa") {
        if (!organizationParentId) throw new Error("Selecione o Grupo Econômico da Empresa.");
        await service.createCompany({ groupId: organizationParentId, name: organizationName }, currentUser);
      } else {
        if (!organizationParentId) throw new Error("Selecione a Empresa da Unidade.");
        await service.createUnit({ companyId: organizationParentId, name: organizationName }, currentUser);
      }
      setOrganizationName("");
      setOrganizationParentId("");
      await loadOrganizationStructure(activeProject.id);
    } catch (error: any) {
      setOrganizationError(error?.message || "Não foi possível criar a estrutura organizacional.");
    }
  };

  // Derivação do estado canônico oficial: NO_SOURCE | SOURCE_CONNECTED | DISCOVERING | WAITING_CONFIRMATION | READY
  const portfolioItems = useMemo(() => {
    return projects.map((p) => {
      let canonicalState: "NO_SOURCE" | "SOURCE_CONNECTED" | "DISCOVERING" | "WAITING_CONFIRMATION" | "READY" = "NO_SOURCE";

      if (p.canonicalState) {
        canonicalState = p.canonicalState;
      } else if (p.spreadsheets && p.spreadsheets.length > 0) {
        canonicalState = p.analysis ? "READY" : "WAITING_CONFIRMATION";
      } else {
        canonicalState = "NO_SOURCE";
      }

      return {
        project: p,
        canonicalState
      };
    });
  }, [projects]);

  // Agrupa os itens por Cliente
  const groupedByClient = useMemo(() => {
    const map = new Map<string, typeof portfolioItems>();

    portfolioItems.forEach((item) => {
      const clientName = item.project.client || "Outros Clientes";
      if (!map.has(clientName)) {
        map.set(clientName, []);
      }
      map.get(clientName)!.push(item);
    });

    return map;
  }, [portfolioItems]);

  // Filtragem por busca e por estado canônico
  const filteredGroupedClients = useMemo(() => {
    const result = new Map<string, typeof portfolioItems>();

    groupedByClient.forEach((items, clientName) => {
      const filteredItems = items.filter((item) => {
        const matchesQuery =
          clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.project.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.project.segment.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesState = filterState === "ALL" || item.canonicalState === filterState;

        return matchesQuery && matchesState;
      });

      if (filteredItems.length > 0) {
        result.set(clientName, filteredItems);
      }
    });

    return result;
  }, [groupedByClient, searchQuery, filterState]);

  const getStateBadge = (state: "NO_SOURCE" | "SOURCE_CONNECTED" | "DISCOVERING" | "WAITING_CONFIRMATION" | "READY") => {
    switch (state) {
      case "NO_SOURCE":
        return { label: "SEM FONTE (NO_SOURCE)", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "SOURCE_CONNECTED":
        return { label: "FONTE CONECTADA", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      case "DISCOVERING":
        return { label: "DESCOBERTA ATIVA", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" };
      case "WAITING_CONFIRMATION":
        return { label: "AGUARDANDO VALIDAÇÃO", style: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" };
      case "READY":
        return { label: "PRONTO (READY)", style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-850 dark:text-slate-150 animate-fade-in" id="minha-carteira-view">
      {/* Modal de Gestão de Clientes (F1.2A) */}
      <ClientManagementModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientSelected={() => {
          void loadData();
        }}
      />

      {/* Modal de Gestão de Engajamentos (F1.2B) */}
      <EngagementModal
        isOpen={isEngagementModalOpen}
        onClose={() => setIsEngagementModalOpen(false)}
        onEngagementCreated={handleEngagementCreated}
      />

      {/* Header com Identificação do Consultor Logado */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Briefcase size={16} />
            <span>ASTERION — Consulting Intelligence</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Minha Carteira de Clientes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consultor Ativo: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser?.profile?.fullName || "Consultor"}</span> ({currentUser?.profile?.email || "consultor@asterion.com"})
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsClientModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <Users size={16} />
            <span>Gerenciar Clientes</span>
          </button>

          <button
            onClick={() => {
              if (onCreateNewEngagement) onCreateNewEngagement();
              setIsEngagementModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Iniciar Novo Engajamento</span>
          </button>
        </div>
      </div>

      {activeProject && (
        <section
          data-testid="engagement-organization-panel"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Contexto do engajamento: {activeProject.group}
                </p>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Estrutura organizacional
                </h2>
              </div>
              {onSelectEngagement && (
                <button
                  type="button"
                  onClick={() => onSelectEngagement(activeProject.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  data-testid="open-consulting-home-btn"
                >
                  <Briefcase size={14} />
                  <span>Acessar Home da Consultoria</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cadastre o Grupo, as Empresas e as Unidades que receberão as fontes deste engajamento.
            </p>
          </div>

          <form
            data-testid="organizational-scope-form"
            onSubmit={handleCreateOrganization}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          >
            <label className="space-y-1">
              <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">O que deseja cadastrar?</span>
              <select
                aria-label="Tipo de estrutura"
                value={organizationFormType}
                onChange={(event) => {
                  setOrganizationFormType(event.target.value as OrganizationFormType);
                  setOrganizationParentId("");
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="Grupo">Grupo</option>
                <option value="Empresa">Empresa</option>
                <option value="Unidade">Unidade</option>
              </select>
            </label>

            {organizationFormType !== "Grupo" ? (
              <label className="space-y-1">
                <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {organizationFormType === "Empresa" ? "Grupo Econômico" : "Empresa"}
                </span>
                <select
                  aria-label={organizationFormType === "Empresa" ? "Grupo Econômico" : "Empresa"}
                  required
                  value={organizationParentId}
                  onChange={(event) => setOrganizationParentId(event.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">Selecione...</option>
                  {(organizationFormType === "Empresa" ? groups : companies).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
            ) : <div />}

            <label className="space-y-1">
              <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nome</span>
              <input
                aria-label="Nome da estrutura"
                required
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder={organizationFormType === "Grupo" ? "Ex.: Grupo principal" : organizationFormType === "Empresa" ? "Ex.: Empresa operacional" : "Ex.: Unidade central"}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors"
            >
              <Plus size={14} />
              Salvar estrutura
            </button>
          </form>

          {organizationError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
              <AlertCircle size={14} />
              {organizationError}
            </div>
          )}

          {groups.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum Grupo cadastrado neste engajamento.</p>
          ) : (
            <div className="space-y-2" data-testid="organizational-scope-list">
              {groups.map((group) => {
                const groupCompanies = companies.filter((company) => company.parentId === group.id);
                return (
                  <div key={group.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                      <Building2 size={14} className="text-blue-600" />
                      {group.name}
                    </div>
                    {groupCompanies.length > 0 && (
                      <div className="mt-2 ml-5 space-y-1">
                        {groupCompanies.map((company) => {
                          const companyUnits = units.filter((unit) => unit.parentId === company.id);
                          return (
                            <div key={company.id} className="text-xs text-slate-600 dark:text-slate-300">
                              <div className="font-semibold">{company.name}</div>
                              {companyUnits.length > 0 && (
                                <div className="ml-4 text-[11px] text-slate-500 dark:text-slate-400">
                                  {companyUnits.map((unit) => <div key={unit.id}>{unit.name}</div>)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Buscar por cliente, grupo ou segmento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-600 dark:text-slate-400 shrink-0">Filtrar Estado:</span>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os Estados</option>
            <option value="NO_SOURCE">Sem Fonte (NO_SOURCE)</option>
            <option value="SOURCE_CONNECTED">Fonte Conectada</option>
            <option value="DISCOVERING">Descoberta Ativa</option>
            <option value="WAITING_CONFIRMATION">Aguardando Validação</option>
            <option value="READY">Pronto (READY)</option>
          </select>
        </div>
      </div>

      {/* Lista de Engajamentos Agrupados por Cliente */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs font-semibold">
          Carregando carteira de clientes...
        </div>
      ) : filteredGroupedClients.size === 0 ? (
        <div id="carteira-vazia-state" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center max-w-lg mx-auto my-8 space-y-4 shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 border border-blue-100 dark:border-blue-900">
            <Folder size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Nenhum engajamento encontrado</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {searchQuery || filterState !== "ALL"
                ? "Nenhum cliente atende aos filtros pesquisados. Tente ajustar os parâmetros de busca."
                : "Sua carteira ainda não possui engajamentos ativos. Clique abaixo para iniciar o onboarding do seu primeiro cliente."}
            </p>
          </div>
          {onCreateNewEngagement && !searchQuery && filterState === "ALL" && (
            <button
              onClick={onCreateNewEngagement}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Iniciar Primeiro Engajamento</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(filteredGroupedClients.entries()).map(([clientName, items]) => (
            <div key={clientName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    {clientName}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {items.length} {items.length === 1 ? "engajamento" : "engajamentos"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(({ project, canonicalState }) => {
                  const badge = getStateBadge(canonicalState);
                  const isActive = project.id === activeProjectId;

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleSelectProject(project.id)}
                      data-testid={`engagement-card-${project.id}`}
                      className={`border rounded-xl p-4 transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                        isActive
                          ? "border-blue-500 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.style}`}>
                            {badge.label}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-400">
                              <CheckCircle2 size={12} /> Ativo
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {project.group || project.client}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Segmento: {project.segment || "Não informado"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Atualizado: {new Date(project.lastUpdated).toLocaleDateString("pt-BR")}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5">
                          Abrir <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
