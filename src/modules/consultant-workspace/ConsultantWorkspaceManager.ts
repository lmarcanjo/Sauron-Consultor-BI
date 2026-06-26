import { WorkspaceProject, ActionPlan, Meeting, WorkspaceSpreadsheet, WorkspaceDbConnection, WorkspaceImportProfile, WorkspaceFilter, WorkspaceKpi, WorkspaceDashboard, WorkspacePresentation, WorkspaceHistoryEvent, WorkspaceAuditEvent, AnalysisResult } from './types';
import { WorkspaceRepository } from './WorkspaceRepository';

export class ConsultantWorkspaceManager {
  private repository: WorkspaceRepository;
  private ACTIVE_PROJECT_KEY = 'sauron_active_project_id';

  constructor() {
    this.repository = new WorkspaceRepository();
  }

  async setActiveProject(projectId: string | null) {
    if (projectId) localStorage.setItem(this.ACTIVE_PROJECT_KEY, projectId);
    else localStorage.removeItem(this.ACTIVE_PROJECT_KEY);
  }

  async getActiveProject(): Promise<WorkspaceProject | null> {
    const id = localStorage.getItem(this.ACTIVE_PROJECT_KEY);
    if (!id) return null;
    const project = await this.repository.getProject(id);
    if (!project) { this.setActiveProject(null); return null; }
    return project;
  }

  async createProject(project: Omit<WorkspaceProject, 'id' | 'isArchived' | 'lastUpdated' | 'meetings'>): Promise<WorkspaceProject> {
    const newProject: WorkspaceProject = {
      ...project,
      id: crypto.randomUUID(),
      isArchived: false,
      lastUpdated: new Date().toISOString(),
      meetings: []
    };
    await this.repository.saveProject(newProject);
    return newProject;
  }

  async updateProject(project: WorkspaceProject) {
    project.lastUpdated = new Date().toISOString();
    await this.repository.saveProject(project);
  }

  async duplicateProject(projectId: string): Promise<WorkspaceProject> {
    const project = await this.repository.getProject(projectId);
    if (!project) throw new Error('Projeto não encontrado');
    return await this.createProject({ ...project, client: `${project.client} (Cópia)` });
  }

  async archiveProject(projectId: string, archive: boolean = true) {
    const project = await this.repository.getProject(projectId);
    if (project) {
        project.isArchived = archive;
        await this.updateProject(project);
    }
  }

  async deleteProject(projectId: string) {
    await this.repository.deleteProject(projectId);
    const activeId = localStorage.getItem(this.ACTIVE_PROJECT_KEY);
    if (activeId === projectId) this.setActiveProject(null);
  }

  async listProjects() { return await this.repository.getAllProjects(); }
  async listActiveProjects() { return (await this.listProjects()).filter(p => !p.isArchived); }
  async listArchivedProjects() { return (await this.listProjects()).filter(p => p.isArchived); }

  async saveMeeting(projectId: string, meeting: Meeting) {
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

  async deleteMeeting(projectId: string, meetingId: string) {
    const project = await this.repository.getProject(projectId);
    if (project) {
        project.meetings = project.meetings.filter(m => m.id !== meetingId);
        await this.updateProject(project);
    }
  }

  async addSpreadsheetToProject(projectId: string, spreadsheet: WorkspaceSpreadsheet) {
    const project = await this.repository.getProject(projectId);
    if (project) {
        project.spreadsheets.push(spreadsheet);
        await this.updateProject(project);
    }
  }

  async saveActionPlan(projectId: string, plan: ActionPlan) {
    const project = await this.repository.getProject(projectId);
    if (project) {
        const index = project.actionPlans.findIndex(a => a.id === plan.id);
        if (index !== -1) project.actionPlans[index] = plan;
        else project.actionPlans.push(plan);
        await this.updateProject(project);
    }
  }

  async saveAnalysis(projectId: string, analysis: AnalysisResult) {
    const project = await this.repository.getProject(projectId);
    if (project) {
        project.analysis = analysis;
        await this.updateProject(project);
    }
  }
}

export const consultantWorkspaceManager = new ConsultantWorkspaceManager();
