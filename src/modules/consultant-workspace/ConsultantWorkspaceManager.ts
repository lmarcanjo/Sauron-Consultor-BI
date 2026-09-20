import { WorkspaceProject, Meeting, WorkspaceSpreadsheet, ActionPlan, AnalysisResult } from './types';
import { WorkspaceRepository } from './WorkspaceRepository';
import { ClientService } from './ClientService';
import { EngagementService } from './EngagementService';
import { PortfolioService } from './PortfolioService';
import { OrganizationService } from './OrganizationService';

import { EnterpriseRepository } from '../../core/persistence/EnterpriseRepository';

import { DataSourceService } from '../../core/datasource/DataSourceService';

export class ConsultantWorkspaceManager {
  private repository: WorkspaceRepository;
  public enterpriseRepository: EnterpriseRepository;
  public clientService: ClientService;
  public engagementService: EngagementService;
  public portfolioService: PortfolioService;
  public organizationService: OrganizationService;
  public dataSourceService: DataSourceService;

  constructor(repository: WorkspaceRepository = new WorkspaceRepository(), enterpriseRepository: EnterpriseRepository = new EnterpriseRepository()) {
    this.repository = repository;
    this.enterpriseRepository = enterpriseRepository;
    this.clientService = new ClientService(this.repository);
    this.engagementService = new EngagementService(this.repository);
    this.portfolioService = new PortfolioService(this.repository);
    this.organizationService = new OrganizationService(this.enterpriseRepository, this.repository);
    this.dataSourceService = new DataSourceService(undefined, this.repository, this.organizationService);
  }

  // --- FACHADA DE COMPATIBILIDADE PARA ESTRUTURA ORGANIZACIONAL (F1.3) ---
  async createGroup(dto: import('./OrganizationService').CreateGroupDTO) {
    return await this.organizationService.createGroup(dto);
  }

  async updateGroup(id: string, dto: Partial<import('./OrganizationService').CreateGroupDTO>) {
    return await this.organizationService.updateGroup(id, dto);
  }

  async listGroupsByEngagement(engagementId: string) {
    return await this.organizationService.listGroupsByEngagement(engagementId);
  }

  async createCompany(dto: import('./OrganizationService').CreateCompanyDTO) {
    return await this.organizationService.createCompany(dto);
  }

  async updateCompany(id: string, dto: Partial<import('./OrganizationService').CreateCompanyDTO>) {
    return await this.organizationService.updateCompany(id, dto);
  }

  async listCompaniesByGroup(groupId: string) {
    return await this.organizationService.listCompaniesByGroup(groupId);
  }

  async createUnit(dto: import('./OrganizationService').CreateUnitDTO) {
    return await this.organizationService.createUnit(dto);
  }

  async updateUnit(id: string, dto: Partial<import('./OrganizationService').CreateUnitDTO>) {
    return await this.organizationService.updateUnit(id, dto);
  }

  async listUnitsByCompany(companyId: string) {
    return await this.organizationService.listUnitsByCompany(companyId);
  }

  async deleteGroup(id: string) {
    return await this.organizationService.deleteGroup(id);
  }

  async deleteCompany(id: string) {
    return await this.organizationService.deleteCompany(id);
  }

  async deleteUnit(id: string) {
    return await this.organizationService.deleteUnit(id);
  }

  // --- FACHADA DE COMPATIBILIDADE PARA CLIENTES (F1.2A) ---
  async listClients(): Promise<string[]> {
    return await this.clientService.listClients();
  }

  async listClientEntities() {
    return await this.clientService.listClientEntities();
  }

  async createClient(dto: import('./ClientService').CreateClientDTO) {
    return await this.clientService.createClient(dto);
  }

  async updateClient(id: string, dto: import('./ClientService').UpdateClientDTO) {
    return await this.clientService.updateClient(id, dto);
  }

  async getClientById(id: string) {
    return await this.clientService.getClientById(id);
  }

  // --- FACHADA DE COMPATIBILIDADE PARA PORTFOLIO ---
  async setActiveProject(projectId: string | null): Promise<void> {
    return await this.portfolioService.setActiveProject(projectId);
  }

  async getActiveProject(): Promise<WorkspaceProject | null> {
    return await this.portfolioService.getActiveProject();
  }

  async listProjects(): Promise<WorkspaceProject[]> {
    return await this.portfolioService.listProjects();
  }

  async listActiveProjects(): Promise<WorkspaceProject[]> {
    return await this.portfolioService.listActiveProjects();
  }

  async listArchivedProjects(): Promise<WorkspaceProject[]> {
    return await this.portfolioService.listArchivedProjects();
  }

  // --- FACHADA DE COMPATIBILIDADE PARA ENGAJAMENTOS ---
  // --- FACHADA DE COMPATIBILIDADE PARA ENGAJAMENTOS (F1.2B) ---
  async createEngagement(dto: import('./EngagementService').CreateEngagementDTO) {
    return await this.engagementService.createEngagement(dto);
  }

  async updateEngagement(id: string, dto: import('./EngagementService').UpdateEngagementDTO) {
    return await this.engagementService.updateEngagement(id, dto);
  }

  async archiveEngagement(id: string, archive: boolean = true) {
    return await this.engagementService.archiveEngagement(id, archive);
  }

  async getEngagementById(id: string) {
    return await this.engagementService.getEngagementById(id);
  }

  async listEngagementsByClient(clientId: string) {
    return await this.engagementService.listEngagementsByClient(clientId);
  }

  async createProject(project: Omit<WorkspaceProject, 'id' | 'isArchived' | 'lastUpdated' | 'meetings'>): Promise<WorkspaceProject> {
    return await this.engagementService.createProject(project);
  }

  async updateProject(project: WorkspaceProject): Promise<void> {
    return await this.engagementService.updateProject(project);
  }

  async duplicateProject(projectId: string): Promise<WorkspaceProject> {
    return await this.engagementService.duplicateProject(projectId);
  }

  async archiveProject(projectId: string, archive: boolean = true): Promise<void> {
    return await this.engagementService.archiveProject(projectId, archive);
  }

  async deleteProject(projectId: string): Promise<void> {
    const activeId = (await this.portfolioService.getActiveProject())?.id;
    await this.engagementService.deleteProject(projectId);
    if (activeId === projectId) {
      await this.portfolioService.setActiveProject(null);
    }
  }

  async saveMeeting(projectId: string, meeting: Meeting): Promise<void> {
    return await this.engagementService.saveMeeting(projectId, meeting);
  }

  async getMeetings(projectId: string): Promise<Meeting[]> {
    return await this.engagementService.getMeetings(projectId);
  }

  async deleteMeeting(projectId: string, meetingId: string): Promise<void> {
    return await this.engagementService.deleteMeeting(projectId, meetingId);
  }

  async addSpreadsheetToProject(projectId: string, spreadsheet: WorkspaceSpreadsheet): Promise<void> {
    return await this.engagementService.addSpreadsheetToProject(projectId, spreadsheet);
  }

  async saveActionPlan(projectId: string, plan: ActionPlan): Promise<void> {
    return await this.engagementService.saveActionPlan(projectId, plan);
  }

  async saveAnalysis(projectId: string, analysis: AnalysisResult): Promise<void> {
    return await this.engagementService.saveAnalysis(projectId, analysis);
  }
}

export const consultantWorkspaceManager = new ConsultantWorkspaceManager();
