import { WorkspaceProject } from './types';

export class WorkspaceRepository {
  private STORAGE_KEY = 'sauron_workspace_projects';

  async saveProject(project: WorkspaceProject): Promise<void> {
    const projects = await this.getAllProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
  }

  async getProject(id: string): Promise<WorkspaceProject | null> {
    const projects = await this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  async getAllProjects(): Promise<WorkspaceProject[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.getAllProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }
}
