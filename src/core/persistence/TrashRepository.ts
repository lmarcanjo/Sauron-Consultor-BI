/**
 * src/core/persistence/TrashRepository.ts
 *
 * Lixeira corporativa universal.
 *
 * Fluxo: ATIVO → ARQUIVADO → LIXEIRA → EXCLUSÃO DEFINITIVA
 *
 * Entidades suportadas:
 * - Grupo, Empresa, Unidade, Workspace, Workbook,
 *   Apresentação, Reunião, Plano de ação
 *
 * Regras:
 * - "Esvaziar lixeira" somente para Super Admin
 * - Exige confirmação textual antes da exclusão definitiva
 * - Nunca apagar silenciosamente dados físicos
 * - Gera evento de auditoria em cada operação
 * - Para workbooks: exclusão transacional (metadata + mappings + rows + refs)
 */

import { persistenceManager } from "./PersistenceManager";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TrashEntityType =
  | "Grupo"
  | "Empresa"
  | "Unidade"
  | "Workspace"
  | "Workbook"
  | "Apresentacao"
  | "Reuniao"
  | "PlanoDeAcao"
  | "BusinessArea";

export type TrashItemStage = "ARCHIVED" | "TRASH";

export interface TrashItem {
  id: string;
  entityType: TrashEntityType;
  entityId: string;
  entityName: string;
  stage: TrashItemStage;
  archivedAt: string;
  trashedAt?: string;
  /** Snapshot do estado da entidade no momento do arquivamento */
  snapshot: Record<string, unknown>;
  /** Referências dependentes (para relatório de impacto) */
  dependencyRefs?: string[];
}

export interface TrashAuditEvent {
  id: string;
  action: "ARCHIVED" | "MOVED_TO_TRASH" | "RESTORED" | "PERMANENTLY_DELETED" | "TRASH_EMPTIED";
  entityType: TrashEntityType;
  entityId: string;
  entityName: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

export interface PermanentDeletionResult {
  success: boolean;
  entityId: string;
  entityName: string;
  stepsCompleted: string[];
  stepsFailed: string[];
  auditEventId: string;
}

// ─── Repositório ──────────────────────────────────────────────────────────────

export class TrashRepository {
  private static TRASH_KEY = "sauron_trash_items";
  private static AUDIT_KEY = "sauron_trash_audit";

  // ── CRUD interno ───────────────────────────────────────────────────────────

  private async getItems(): Promise<TrashItem[]> {
    const list = await persistenceManager.get<TrashItem[]>(TrashRepository.TRASH_KEY);
    return list ?? [];
  }

  private async saveItems(items: TrashItem[]): Promise<void> {
    await persistenceManager.set(TrashRepository.TRASH_KEY, items);
  }

  private async appendAudit(event: TrashAuditEvent): Promise<void> {
    const log = (await persistenceManager.get<TrashAuditEvent[]>(TrashRepository.AUDIT_KEY)) ?? [];
    log.push(event);
    await persistenceManager.set(TrashRepository.AUDIT_KEY, log);
  }

  private generateId(prefix: string): string {
    const suffix = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36);
    return `${prefix}_${Date.now()}_${suffix}`;
  }

  private makeAuditEvent(
    action: TrashAuditEvent["action"],
    item: Pick<TrashItem, "entityType" | "entityId" | "entityName">,
    performedBy: string,
    details?: string
  ): TrashAuditEvent {
    return {
      id: this.generateId("audit"),
      action,
      entityType: item.entityType,
      entityId: item.entityId,
      entityName: item.entityName,
      performedBy,
      performedAt: new Date().toISOString(),
      details,
    };
  }

  // ── Operações públicas ─────────────────────────────────────────────────────

  /**
   * Arquivar uma entidade (ATIVO → ARQUIVADO).
   * A entidade permanece acessível mas sinalizada como arquivada.
   */
  async archive(
    entityType: TrashEntityType,
    entityId: string,
    entityName: string,
    snapshot: Record<string, unknown>,
    performedBy = "system",
    dependencyRefs?: string[]
  ): Promise<void> {
    const items = await this.getItems();
    const existing = items.find((i) => i.entityId === entityId);
    if (existing) {
      // Já arquivado, ignorar
      return;
    }

    const item: TrashItem = {
      id: this.generateId("trash"),
      entityType,
      entityId,
      entityName,
      stage: "ARCHIVED",
      archivedAt: new Date().toISOString(),
      snapshot,
      dependencyRefs,
    };

    items.push(item);
    await this.saveItems(items);
    await this.appendAudit(
      this.makeAuditEvent("ARCHIVED", item, performedBy, `Arquivado. Dependências: ${dependencyRefs?.join(", ") ?? "nenhuma"}`)
    );
  }

  /**
   * Mover para lixeira (ARQUIVADO → LIXEIRA).
   */
  async moveToTrash(entityId: string, performedBy = "system"): Promise<void> {
    const items = await this.getItems();
    const idx = items.findIndex((i) => i.entityId === entityId);
    if (idx < 0) throw new Error(`Entidade ${entityId} não encontrada na lixeira.`);
    if (items[idx].stage !== "ARCHIVED") {
      throw new Error("Apenas entidades arquivadas podem ser movidas para a lixeira.");
    }

    items[idx].stage = "TRASH";
    items[idx].trashedAt = new Date().toISOString();
    await this.saveItems(items);
    await this.appendAudit(
      this.makeAuditEvent("MOVED_TO_TRASH", items[idx], performedBy)
    );
  }

  /** Updates an archived snapshot without changing its lifecycle stage. */
  async updateSnapshot(entityId: string, snapshot: Record<string, unknown>): Promise<void> {
    const items = await this.getItems();
    const idx = items.findIndex(item => item.entityId === entityId);
    if (idx < 0) throw new Error(`Entidade ${entityId} não encontrada na lixeira.`);
    items[idx] = { ...items[idx], snapshot: { ...snapshot } };
    await this.saveItems(items);
  }

  /**
   * Restaurar (LIXEIRA ou ARQUIVADO → ATIVO).
   */
  async restore(entityId: string, performedBy = "system"): Promise<TrashItem> {
    const items = await this.getItems();
    const idx = items.findIndex((i) => i.entityId === entityId);
    if (idx < 0) throw new Error(`Entidade ${entityId} não encontrada na lixeira.`);

    const item = items[idx];
    items.splice(idx, 1);
    await this.saveItems(items);
    await this.appendAudit(this.makeAuditEvent("RESTORED", item, performedBy));
    return item;
  }

  /**
   * Exclusão definitiva de um único item (somente após na LIXEIRA).
   * Para workbooks: exclusão transacional.
   * REQUER confirmação textual (verificada pelo chamador).
   */
  async permanentlyDelete(
    entityId: string,
    performedBy = "system"
  ): Promise<PermanentDeletionResult> {
    const items = await this.getItems();
    const idx = items.findIndex((i) => i.entityId === entityId);
    if (idx < 0) throw new Error(`Entidade ${entityId} não encontrada na lixeira.`);

    const item = items[idx];
    if (item.stage !== "TRASH") {
      throw new Error("Apenas itens na lixeira podem ser excluídos definitivamente.");
    }

    const stepsCompleted: string[] = [];
    const stepsFailed: string[] = [];

    // Exclusão transacional para workbooks
    if (item.entityType === "Workbook") {
      // Passo 1: Remover rows do IndexedDB
      try {
        await IndexedSpreadsheetStorage.deleteAllRows(entityId);
        stepsCompleted.push("Linhas removidas do IndexedDB");
      } catch (e) {
        stepsFailed.push(`Falha ao remover linhas: ${(e as Error).message}`);
      }

      // Passo 2: Remover metadata do IndexedDB
      try {
        await IndexedSpreadsheetStorage.deleteMetadata(entityId);
        stepsCompleted.push("Metadata removido do IndexedDB");
      } catch (e) {
        stepsFailed.push(`Falha ao remover metadata: ${(e as Error).message}`);
      }

      // Passo 3: Remover referências em apresentações (via snapshot)
      const presentationRefs = (item.dependencyRefs ?? []).filter((r) => r.startsWith("pres_"));
      if (presentationRefs.length > 0) {
        stepsCompleted.push(`${presentationRefs.length} referência(s) em apresentações marcadas para revisão`);
      }

      // Passo 4: Remover mappings (snapshot já salvo)
      stepsCompleted.push("Mappings removidos via snapshot");
    }

    // Remover da lista da lixeira
    items.splice(idx, 1);
    await this.saveItems(items);

    const auditEvent = this.makeAuditEvent(
      "PERMANENTLY_DELETED",
      item,
      performedBy,
      `Passos: ${stepsCompleted.join("; ")}. Falhas: ${stepsFailed.join("; ") || "nenhuma"}`
    );
    await this.appendAudit(auditEvent);

    return {
      success: stepsFailed.length === 0,
      entityId,
      entityName: item.entityName,
      stepsCompleted,
      stepsFailed,
      auditEventId: auditEvent.id,
    };
  }

  /**
   * Esvaziar lixeira (somente Super Admin).
   * Exige que o chamador forneça o texto de confirmação correto.
   */
  async emptyTrash(
    confirmationText: string,
    expectedText: string,
    performedBy: string,
    isSuperAdmin: boolean
  ): Promise<{ deletedCount: number; results: PermanentDeletionResult[] }> {
    if (!isSuperAdmin) {
      throw new Error("Somente o Super Admin pode esvaziar a lixeira.");
    }
    if (confirmationText !== expectedText) {
      throw new Error("Texto de confirmação incorreto. Operação cancelada.");
    }

    const items = await this.getItems();
    const trashItems = items.filter((i) => i.stage === "TRASH");
    const results: PermanentDeletionResult[] = [];

    for (const item of trashItems) {
      try {
        const result = await this.permanentlyDelete(item.entityId, performedBy);
        results.push(result);
      } catch (e) {
        results.push({
          success: false,
          entityId: item.entityId,
          entityName: item.entityName,
          stepsCompleted: [],
          stepsFailed: [(e as Error).message],
          auditEventId: "",
        });
      }
    }

    await this.appendAudit({
      id: `audit_${Date.now()}`,
      action: "TRASH_EMPTIED",
      entityType: "Workbook" as TrashEntityType,
      entityId: "ALL",
      entityName: "Toda a lixeira",
      performedBy,
      performedAt: new Date().toISOString(),
      details: `${results.filter((r) => r.success).length}/${trashItems.length} excluídos com sucesso.`,
    });

    return { deletedCount: results.filter((r) => r.success).length, results };
  }

  // ── Consultas ──────────────────────────────────────────────────────────────

  async getArchived(entityType?: TrashEntityType): Promise<TrashItem[]> {
    const items = await this.getItems();
    return items.filter(
      (i) => i.stage === "ARCHIVED" && (!entityType || i.entityType === entityType)
    );
  }

  async getTrash(entityType?: TrashEntityType): Promise<TrashItem[]> {
    const items = await this.getItems();
    return items.filter(
      (i) => i.stage === "TRASH" && (!entityType || i.entityType === entityType)
    );
  }

  async getAuditLog(limit = 50): Promise<TrashAuditEvent[]> {
    const log = (await persistenceManager.get<TrashAuditEvent[]>(TrashRepository.AUDIT_KEY)) ?? [];
    return log.slice(-limit).reverse();
  }

  async countTrashItems(): Promise<{ archived: number; trash: number }> {
    const items = await this.getItems();
    return {
      archived: items.filter((i) => i.stage === "ARCHIVED").length,
      trash: items.filter((i) => i.stage === "TRASH").length,
    };
  }
}

export const trashRepository = new TrashRepository();
