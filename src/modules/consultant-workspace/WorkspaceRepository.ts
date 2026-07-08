import { WorkspaceProject } from './types';

export class WorkspaceRepository {
  private STORAGE_KEY = 'sauron_workspace_projects';
  private SCHEMA_VERSION = '1.0.0';

  async saveProject(project: WorkspaceProject): Promise<void> {
    const projects = await this.getAllProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ version: this.SCHEMA_VERSION, projects }));
  }

  async getProject(id: string): Promise<WorkspaceProject | null> {
    const projects = await this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  async getAllProjects(): Promise<WorkspaceProject[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return parsed.projects || [];
    } catch {
        return [];
    }
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.getAllProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ version: this.SCHEMA_VERSION, projects: filtered }));
  }

  async exportProjects(): Promise<string> {
      return localStorage.getItem(this.STORAGE_KEY) || '{}';
  }

  async importProjects(data: string): Promise<void> {
      localStorage.setItem(this.STORAGE_KEY, data);
  }

  async clearAll(): Promise<void> {
      localStorage.removeItem(this.STORAGE_KEY);
  }
}
