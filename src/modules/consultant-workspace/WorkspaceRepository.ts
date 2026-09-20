import { WorkspaceProject, ClientEntity } from './types';

export class WorkspaceRepository {
  private STORAGE_KEY = 'sauron_workspace_projects';
  private CLIENTS_STORAGE_KEY = 'asterion_workspace_clients';
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
    if (typeof localStorage === 'undefined') return [];
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

  // --- ENTIDADE CLIENTE (F1.2A) ---

  async saveClient(client: ClientEntity): Promise<void> {
    const clients = await this.getAllClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index !== -1) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    localStorage.setItem(this.CLIENTS_STORAGE_KEY, JSON.stringify({ version: this.SCHEMA_VERSION, clients }));
  }

  async getClient(id: string): Promise<ClientEntity | null> {
    const clients = await this.getAllClients();
    return clients.find(c => c.id === id) || null;
  }

  async getAllClients(): Promise<ClientEntity[]> {
    const data = localStorage.getItem(this.CLIENTS_STORAGE_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return parsed.clients || [];
    } catch {
      return [];
    }
  }

  async deleteClient(id: string): Promise<void> {
    const clients = await this.getAllClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(this.CLIENTS_STORAGE_KEY, JSON.stringify({ version: this.SCHEMA_VERSION, clients: filtered }));
  }

  async exportProjects(): Promise<string> {
      return localStorage.getItem(this.STORAGE_KEY) || '{}';
  }

  async importProjects(data: string): Promise<void> {
      localStorage.setItem(this.STORAGE_KEY, data);
  }

  async clearAll(): Promise<void> {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.CLIENTS_STORAGE_KEY);
  }
}
