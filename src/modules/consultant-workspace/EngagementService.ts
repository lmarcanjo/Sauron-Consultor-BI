import { WorkspaceProject, Meeting, WorkspaceSpreadsheet, ActionPlan, AnalysisResult } from './types';
import { WorkspaceRepository } from './WorkspaceRepository';
import { identityEngine } from '../../core/identity/IdentityEngine';
import { PlatformUser } from '../../core/identity/types';
import { auditEngine } from '../../core/audit/AuditEngine';
import { dispatchPlatformEvent } from '../../core/events/PlatformEvents';

export interface CreateEngagementDTO {
  name: string;
  clientId: string;
  clientName?: string;
  segment?: string;
  group?: string;
}

export interface UpdateEngagementDTO {
  name?: string;
  segment?: string;
  group?: string;
  clientId?: string;
  clientName?: string;
  isArchived?: boolean;
}

export class EngagementService {
  constructor(private repository: WorkspaceRepository) {}

  /**
   * Valida autorização: apenas o consultor proprietário ou SUPER_ADMIN tem acesso ao engajamento
   */
  private checkAuthorization(project: WorkspaceProject, user: PlatformUser | null): void {
    if (!user) return; // Se não houver contexto de identidade em ambiente legado, libera acesso seguro
    if (project.assignedConsultantId && project.assignedConsultantId !== user.id && user.role !== 'SUPER_ADMIN') {
      throw new Error(`Acesso negado ao engajamento ID ${project.id}.`);
    }
  }

  /**
   * Cria um novo engajamento obrigatoriamente associado a um Cliente existente.
   * Estado inicial obrigatório: NO_SOURCE.
   */
  async createEngagement(dto: CreateEngagementDTO, user?: PlatformUser | null): Promise<WorkspaceProject> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();

    // 1. Validação obrigatória: pertencimento a um Cliente
    if (!dto.clientId || dto.clientId.trim().length === 0) {
      throw new Error('O Engajamento deve pertencer obrigatoriamente a um Cliente válido.');
    }

    // 2. Validação obrigatória: nome do engajamento
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('O Nome do Engajamento é obrigatório.');
    }

    const clientName = dto.clientName || 'Cliente sem nome';
    const now = new Date().toISOString();

    const newProject: WorkspaceProject = {
      id: `eng_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      client: clientName,
      clientId: dto.clientId,
      group: dto.group?.trim() || dto.name.trim(),
      segment: dto.segment?.trim() || 'Serviços',
      companies: [],
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
      meetings: [],
      observations: '',
      history: [],
      auditLog: [],
      lastUpdated: now,
      isArchived: false,
      canonicalState: 'NO_SOURCE', // Estado inicial obrigatório
      assignedConsultantId: currentUser?.id
    };

    await this.repository.saveProject(newProject);

    // Auditoria oficial
    auditEngine.logEvent("ENGAJAMENTO_CRIADO", `Engajamento "${newProject.group}" criado para o cliente "${clientName}"`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id,
      count: 1
    });
    dispatchPlatformEvent("WORKSPACE_REGISTRY_CHANGED", { engagementId: newProject.id, action: "CREATED" });

    return newProject;
  }

  /**
   * Método de compatibilidade legada
   */
  async createProject(project: Omit<WorkspaceProject, 'id' | 'isArchived' | 'lastUpdated' | 'meetings'>, user?: PlatformUser | null): Promise<WorkspaceProject> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const newProject: WorkspaceProject = {
      ...project,
      id: crypto.randomUUID(),
      isArchived: false,
      canonicalState: project.canonicalState || 'NO_SOURCE',
      lastUpdated: new Date().toISOString(),
      meetings: [],
      assignedConsultantId: (project as any).assignedConsultantId || currentUser?.id
    };
    await this.repository.saveProject(newProject);
    return newProject;
  }

  async getEngagementById(id: string, user?: PlatformUser | null): Promise<WorkspaceProject | null> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const project = await this.repository.getProject(id);
    if (!project) return null;
    this.checkAuthorization(project, currentUser);
    return project;
  }

  async listEngagementsByClient(clientId: string, user?: PlatformUser | null): Promise<WorkspaceProject[]> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const all = await this.repository.getAllProjects();
    return all.filter(p => {
      if (p.clientId !== clientId && p.client !== clientId) return false;
      if (p.assignedConsultantId && currentUser && p.assignedConsultantId !== currentUser.id && currentUser.role !== 'SUPER_ADMIN') {
        return false;
      }
      return true;
    });
  }

  async updateEngagement(id: string, dto: UpdateEngagementDTO, user?: PlatformUser | null): Promise<WorkspaceProject> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const project = await this.getEngagementById(id, currentUser);
    if (!project) {
      throw new Error(`Engajamento ID ${id} não encontrado.`);
    }

    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new Error('O Nome do Engajamento não pode ser vazio.');
      }
      project.group = dto.name.trim();
    }

    if (dto.segment !== undefined) project.segment = dto.segment.trim();
    if (dto.clientId !== undefined) project.clientId = dto.clientId;
    if (dto.clientName !== undefined) project.client = dto.clientName;
    if (dto.isArchived !== undefined) project.isArchived = dto.isArchived;

    project.lastUpdated = new Date().toISOString();
    await this.repository.saveProject(project);

    auditEngine.logEvent("ENGAJAMENTO_ATUALIZADO", `Engajamento "${project.group}" atualizado`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("WORKSPACE_REGISTRY_CHANGED", { engagementId: project.id, action: "UPDATED" });

    return project;
  }

  async updateProject(project: WorkspaceProject): Promise<void> {
    project.lastUpdated = new Date().toISOString();
    await this.repository.saveProject(project);
  }

  async archiveEngagement(id: string, archive: boolean = true, user?: PlatformUser | null): Promise<WorkspaceProject> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const project = await this.getEngagementById(id, currentUser);
    if (!project) {
      throw new Error(`Engajamento ID ${id} não encontrado.`);
    }

    project.isArchived = archive;
    project.lastUpdated = new Date().toISOString();
    await this.repository.saveProject(project);

    const eventName = archive ? "ENGAJAMENTO_ARQUIVADO" : "ENGAJAMENTO_REATIVADO";
    auditEngine.logEvent(eventName, `Engajamento "${project.group}" ${archive ? 'arquivado' : 'reativado'}`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
    dispatchPlatformEvent("WORKSPACE_REGISTRY_CHANGED", { engagementId: project.id, action: eventName });

    return project;
  }

  async archiveProject(projectId: string, archive: boolean = true): Promise<void> {
    await this.archiveEngagement(projectId, archive);
  }

  async duplicateProject(projectId: string): Promise<WorkspaceProject> {
    const project = await this.repository.getProject(projectId);
    if (!project) throw new Error('Projeto não encontrado');
    return await this.createProject({ ...project, client: `${project.client} (Cópia)` });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.repository.deleteProject(projectId);
  }

  async saveMeeting(projectId: string, meeting: Meeting): Promise<void> {
    const project = await this.repository.getProject(projectId);
    if (project) {
      const index = project.meetings.findIndex(m => m.id === meeting.id);
      if (index !== -1) project.meetings[index] = meeting;
      else project.meetings.push(meeting);
      await this.updateProject(project);
    }
  }

  async getMeetings(projectId: string): Promise<Meeting[]> {
    const project = await this.repository.getProject(projectId);
    return project?.meetings || [];
  }

  async deleteMeeting(projectId: string, meetingId: string): Promise<void> {
    const project = await this.repository.getProject(projectId);
    if (project) {
      project.meetings = project.meetings.filter(m => m.id !== meetingId);
      await this.updateProject(project);
    }
  }

  async addSpreadsheetToProject(projectId: string, spreadsheet: WorkspaceSpreadsheet): Promise<void> {
    const project = await this.repository.getProject(projectId);
    if (project) {
      project.spreadsheets.push(spreadsheet);
      await this.updateProject(project);
    }
  }

  async saveActionPlan(projectId: string, plan: ActionPlan): Promise<void> {
    const project = await this.repository.getProject(projectId);
    if (project) {
      const index = project.actionPlans.findIndex(p => p.id === plan.id);
      if (index !== -1) project.actionPlans[index] = plan;
      else project.actionPlans.push(plan);
      await this.updateProject(project);
    }
  }

  async saveAnalysis(projectId: string, analysis: AnalysisResult): Promise<void> {
    const project = await this.repository.getProject(projectId);
    if (project) {
      project.analysis = analysis;
      await this.updateProject(project);
    }
  }
}
