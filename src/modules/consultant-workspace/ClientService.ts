import { ClientEntity } from './types';
import { WorkspaceRepository } from './WorkspaceRepository';
import { identityEngine } from '../../core/identity/IdentityEngine';
import { PlatformUser } from '../../core/identity/types';
import { auditEngine } from '../../core/audit/AuditEngine';

export interface CreateClientDTO {
  legalName: string;
  tradeName?: string;
  document: string;
  segment?: string;
}

export interface UpdateClientDTO {
  legalName?: string;
  tradeName?: string;
  document?: string;
  segment?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export class ClientService {
  constructor(private repository: WorkspaceRepository) {}

  /**
   * Retorna os nomes únicos dos clientes (compatibilidade legada)
   */
  async listClients(): Promise<string[]> {
    const clients = await this.listClientEntities();
    if (clients.length > 0) {
      return Array.from(new Set(clients.map(c => c.legalName)));
    }
    const projects = await this.repository.getAllProjects();
    const legacyClients = projects.map(p => p.client).filter(Boolean);
    return Array.from(new Set(legacyClients));
  }

  /**
   * Lista todas as entidades de Cliente atribuídas ao consultor logado
   */
  async listClientEntities(user?: PlatformUser | null): Promise<ClientEntity[]> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const allClients = await this.repository.getAllClients();

    if (!currentUser) {
      return allClients.filter(c => !c.assignedConsultantId);
    }

    return allClients.filter(c => {
      if (c.assignedConsultantId) {
        return c.assignedConsultantId === currentUser.id || currentUser.role === 'SUPER_ADMIN';
      }
      return true;
    });
  }

  /**
   * Busca um cliente por ID validando autorização
   */
  async getClientById(id: string, user?: PlatformUser | null): Promise<ClientEntity | null> {
    const clients = await this.listClientEntities(user);
    return clients.find(c => c.id === id) || null;
  }

  /**
   * Cadastra um novo cliente aplicando validações obrigatórias
   */
  async createClient(dto: CreateClientDTO, user?: PlatformUser | null): Promise<ClientEntity> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();

    // 1. Validação de Razão Social obrigatória
    if (!dto.legalName || dto.legalName.trim().length === 0) {
      throw new Error('A Razão Social do cliente é obrigatória.');
    }

    // 2. Validação de Documento obrigatório
    if (!dto.document || dto.document.trim().length === 0) {
      throw new Error('O Documento (CNPJ ou código único) do cliente é obrigatório.');
    }

    const normalizedLegalName = dto.legalName.trim();
    const normalizedDocument = dto.document.trim().replace(/[^\w]/g, '');

    // 3. Validação de Cliente duplicado na mesma carteira (por Razão Social ou Documento)
    const existingClients = await this.listClientEntities(currentUser);
    const isDuplicate = existingClients.some(c => 
      c.legalName.trim().toLowerCase() === normalizedLegalName.toLowerCase() ||
      c.document.trim().replace(/[^\w]/g, '').toLowerCase() === normalizedDocument.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error(`Já existe um cliente cadastrado com a Razão Social "${normalizedLegalName}" ou Documento "${dto.document}" nesta carteira.`);
    }

    const now = new Date().toISOString();
    const newClient: ClientEntity = {
      id: `client_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      legalName: normalizedLegalName,
      tradeName: dto.tradeName?.trim() || undefined,
      document: dto.document.trim(),
      segment: dto.segment?.trim() || undefined,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      assignedConsultantId: currentUser?.id
    };

    await this.repository.saveClient(newClient);

    auditEngine.logEvent("CLIENTE_CADASTRADO", `Cliente "${newClient.legalName}" cadastrado por ${currentUser?.profile?.fullName || "Consultor"}`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id,
      count: 1
    });

    return newClient;
  }

  /**
   * Atualiza dados de um cliente existente
   */
  async updateClient(id: string, dto: UpdateClientDTO, user?: PlatformUser | null): Promise<ClientEntity> {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    const client = await this.getClientById(id, currentUser);

    if (!client) {
      throw new Error(`Cliente ID ${id} não encontrado ou sem permissão de acesso.`);
    }

    if (dto.legalName !== undefined) {
      if (!dto.legalName || dto.legalName.trim().length === 0) {
        throw new Error('A Razão Social não pode ser vazia.');
      }
      const normalizedName = dto.legalName.trim();
      const existingClients = await this.listClientEntities(currentUser);
      const isDuplicate = existingClients.some(c => c.id !== id && c.legalName.trim().toLowerCase() === normalizedName.toLowerCase());
      if (isDuplicate) {
        throw new Error(`Já existe outro cliente com a Razão Social "${normalizedName}" nesta carteira.`);
      }
      client.legalName = normalizedName;
    }

    if (dto.document !== undefined) {
      if (!dto.document || dto.document.trim().length === 0) {
        throw new Error('O Documento não pode ser vazio.');
      }
      client.document = dto.document.trim();
    }

    if (dto.tradeName !== undefined) client.tradeName = dto.tradeName.trim() || undefined;
    if (dto.segment !== undefined) client.segment = dto.segment.trim() || undefined;
    if (dto.status !== undefined) client.status = dto.status;

    client.updatedAt = new Date().toISOString();

    await this.repository.saveClient(client);

    auditEngine.logEvent("CLIENTE_ATUALIZADO", `Cliente "${client.legalName}" atualizado`, "INFO", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });

    return client;
  }
}
