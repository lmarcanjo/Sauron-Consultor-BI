import { WorkspaceProject, ActionPlan, Meeting } from './types';
import { WorkspaceRepository } from './WorkspaceRepository';

export class ConsultantWorkspaceManager {
  private repository: WorkspaceRepository;
  private activeProjectId: string | null = null;

  constructor() {
    this.repository = new WorkspaceRepository();
  }

  async createProject(project: Omit<WorkspaceProject, 'id' | 'isArchived' | 'lastUpdated'>): Promise<WorkspaceProject> {
    const newProject: WorkspaceProject = {
      ...project,
      id: crypto.randomUUID(),
      isArchived: false,
      lastUpdated: new Date().toISOString(),
    };
    await this.repository.saveProject(newProject);
    return newProject;
  }

  async setActiveProject(projectId: string) {
    this.activeProjectId = projectId;
  }

  async getActiveProject(): Promise<WorkspaceProject | null> {
    if (!this.activeProjectId) return null;
    return await this.repository.getProject(this.activeProjectId);
  }

  async duplicateProject(projectId: string): Promise<WorkspaceProject> {
    const project = await this.repository.getProject(projectId);
    if (!project) throw new Error('Projeto não encontrado');
    return await this.createProject({ ...project, client: `${project.client} (Cópia)` });
  }

  async archiveProject(projectId: string) {
    const project = await this.repository.getProject(projectId);
    if (project) {
      await this.repository.saveProject({ ...project, isArchived: true });
    }
  }

  async deleteProject(projectId: string) {
    await this.repository.deleteProject(projectId);
  }

  async saveActionPlan(projectId: string, plan: ActionPlan) {
    const project = await this.repository.getProject(projectId);
    if (project) {
        project.actionPlans.push(plan);
        await this.repository.saveProject(project);
    }
  }

  // Meeting mode infrastructure
  async saveMeeting(projectId: string, meeting: Meeting) {
     // TODO: Implement storage in project
  }
}

export const consultantWorkspaceManager = new ConsultantWorkspaceManager();
