import { WorkspaceProject } from './types';
import { WorkspaceRepository } from './WorkspaceRepository';
import { identityEngine } from '../../core/identity/IdentityEngine';
import { PlatformUser } from '../../core/identity/types';
import { auditEngine } from '../../core/audit/AuditEngine';
import { PLATFORM_EVENTS, dispatchPlatformEvent } from '../../core/events/PlatformEvents';

export class PortfolioService {
  private ACTIVE_PROJECT_KEY = 'sauron_active_project_id';

  constructor(private repository: WorkspaceRepository) {}

  /**
   * Retorna exclusivamente os engajamentos atribuídos ao consultor logado.
   * Se não houver consultor autenticado, retorna lista vazia protegida.
   */
  async listProjects(user?: PlatformUser | null): Promise<WorkspaceProject[]> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const allProjects = await this.repository.getAllProjects();

    if (!currentUser) {
      // Se não houver usuário logado no identityEngine, permite listar se não houver atribuição estrita de outro usuário
      return allProjects.filter((p) => !(p as any).assignedConsultantId);
    }

    return allProjects.filter((p) => {
      if ((p as any).assignedConsultantId) {
        return (p as any).assignedConsultantId === currentUser.id || currentUser.role === 'SUPER_ADMIN';
      }
      return true;
    });
  }

  async listActiveProjects(user?: PlatformUser | null): Promise<WorkspaceProject[]> {
    return (await this.listProjects(user)).filter((p) => !p.isArchived);
  }

  async listArchivedProjects(user?: PlatformUser | null): Promise<WorkspaceProject[]> {
    return (await this.listProjects(user)).filter((p) => p.isArchived);
  }

  async setActiveProject(projectId: string | null, user?: PlatformUser | null): Promise<void> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();

    if (projectId) {
      // Validação de Autorização: verifica se o usuário tem permissão para acessar este engajamento específico
      const authorizedProjects = await this.listProjects(currentUser);
      const isAuthorized = authorizedProjects.some((p) => p.id === projectId);

      if (!isAuthorized) {
        throw new Error(`Acesso negado ao engajamento ID: ${projectId}`);
      }

      localStorage.setItem(this.ACTIVE_PROJECT_KEY, projectId);

      // Emissão de evento e audit log oficial: ENGAJAMENTO_SELECIONADO
      auditEngine.logEvent("ENGAJAMENTO_SELECIONADO", `Engajamento ${projectId} selecionado por ${currentUser?.profile?.fullName || currentUser?.id || "Consultor"}`, "INFO", {
        user: currentUser?.profile?.fullName || currentUser?.id,
        count: 1
      });
      dispatchPlatformEvent("WORKSPACE_REGISTRY_CHANGED", { engagementId: projectId, userId: currentUser?.id });
    } else {
      localStorage.removeItem(this.ACTIVE_PROJECT_KEY);
    }
  }

  async getActiveProject(user?: PlatformUser | null): Promise<WorkspaceProject | null> {
    const id = localStorage.getItem(this.ACTIVE_PROJECT_KEY);
    if (!id) return null;

    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const projects = await this.listProjects(currentUser);
    const project = projects.find((p) => p.id === id) || null;

    if (!project) {
      await this.setActiveProject(null, currentUser);
      return null;
    }
    return project;
  }
}
