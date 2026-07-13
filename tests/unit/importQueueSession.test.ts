/**
 * tests/unit/importQueueSession.test.ts
 *
 * Testes unitários do utilitário de fila em sessionStorage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  saveQueue,
  loadQueue,
  clearQueue,
  createSnapshot,
  matchesSignature,
  QueueItemSnapshot,
} from "../../src/utils/importQueueSession";
import { ImportStatus } from "../../src/utils/importStatus";

// Mock sessionStorage
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => { mockStorage[key] = val; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
});

describe("importQueueSession", () => {
  const userId = "user-1";
  const wsId = "ws-1";

  const makeItem = (id: string, status = ImportStatus.PENDING): QueueItemSnapshot => ({
    queueItemId: id,
    fileName: `arquivo-${id}.xlsx`,
    size: 1024,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    lastModified: 1700000000000,
    selectedGroupId: "",
    selectedCompanyId: "",
    selectedUnitId: "",
    selectedSheets: [],
    status,
    progress: 0,
    createdAt: new Date().toISOString(),
  });

  describe("saveQueue / loadQueue", () => {
    it("salva e carrega itens com status READY sem modificação", () => {
      const items = [makeItem("a", ImportStatus.READY), makeItem("b", ImportStatus.READY)];
      saveQueue(userId, wsId, items);
      const loaded = loadQueue(userId, wsId);
      expect(loaded).toHaveLength(2);
      expect(loaded[0].status).toBe(ImportStatus.READY);
      expect(loaded[1].status).toBe(ImportStatus.READY);
    });

    it("retorna array vazio quando não há nada salvo", () => {
      const loaded = loadQueue(userId, wsId);
      expect(loaded).toEqual([]);
    });

    it("isola chaves por userId e workspaceId", () => {
      saveQueue("user-A", "ws-1", [makeItem("x")]);
      const forUserB = loadQueue("user-B", "ws-1");
      expect(forUserB).toEqual([]);
    });
  });

  describe("Recuperação INTERRUPTED", () => {
    it("converte status transitório para INTERRUPTED quando sem workbookId", () => {
      const items: QueueItemSnapshot[] = [
        makeItem("1", ImportStatus.READING),  // transitório, sem workbookId
        makeItem("2", ImportStatus.VALIDATING),
      ];
      saveQueue(userId, wsId, items);
      const loaded = loadQueue(userId, wsId);

      expect(loaded[0].status).toBe(ImportStatus.INTERRUPTED);
      expect(loaded[0].message).toContain("interrompida");
      expect(loaded[1].status).toBe(ImportStatus.INTERRUPTED);
    });

    it("mantém FAILED sem alterar", () => {
      const items = [makeItem("x", ImportStatus.FAILED)];
      saveQueue(userId, wsId, items);
      const loaded = loadQueue(userId, wsId);
      expect(loaded[0].status).toBe(ImportStatus.FAILED);
    });

    it("mantém CANCELLED sem alterar", () => {
      const items = [makeItem("x", ImportStatus.CANCELLED)];
      saveQueue(userId, wsId, items);
      const loaded = loadQueue(userId, wsId);
      expect(loaded[0].status).toBe(ImportStatus.CANCELLED);
    });

    it("converte PERSISTING com workbookId para READY", () => {
      const item = makeItem("z", ImportStatus.PERSISTING);
      item.workbookId = "wb-123";
      saveQueue(userId, wsId, [item]);
      const loaded = loadQueue(userId, wsId);
      expect(loaded[0].status).toBe(ImportStatus.READY);
    });

    it("mantém READY sem modificar", () => {
      const item = makeItem("r", ImportStatus.READY);
      item.workbookId = "wb-456";
      saveQueue(userId, wsId, [item]);
      const loaded = loadQueue(userId, wsId);
      expect(loaded[0].status).toBe(ImportStatus.READY);
    });
  });

  describe("clearQueue", () => {
    it("remove a fila da sessionStorage", () => {
      saveQueue(userId, wsId, [makeItem("a")]);
      clearQueue(userId, wsId);
      const loaded = loadQueue(userId, wsId);
      expect(loaded).toEqual([]);
    });
  });

  describe("createSnapshot", () => {
    it("cria snapshot com status PENDING e campos obrigatórios", () => {
      const mockFile = new File(["content"], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        lastModified: 1700000000000,
      });
      const snap = createSnapshot({ queueItemId: "id-1", file: mockFile });
      expect(snap.queueItemId).toBe("id-1");
      expect(snap.fileName).toBe("test.xlsx");
      expect(snap.status).toBe(ImportStatus.PENDING);
      expect(snap.progress).toBe(0);
      expect(snap.selectedSheets).toEqual([]);
    });
  });

  describe("matchesSignature", () => {
    it("retorna true quando nome, size e lastModified coincidem", () => {
      const snap = makeItem("x");
      snap.fileName = "planilha.xlsx";
      snap.size = 2048;
      snap.lastModified = 1700000001000;

      const file = new File(["a".repeat(2048)], "planilha.xlsx", {
        lastModified: 1700000001000,
      });
      // Sobrescrever size pois File não aceita no construtor de teste
      Object.defineProperty(file, "size", { value: 2048 });

      expect(matchesSignature(snap, file)).toBe(true);
    });

    it("retorna false quando nome difere", () => {
      const snap = makeItem("x");
      snap.fileName = "correto.xlsx";
      snap.size = 100;
      snap.lastModified = 1700000000000;

      const file = new File(["a"], "errado.xlsx", { lastModified: 1700000000000 });
      Object.defineProperty(file, "size", { value: 100 });

      expect(matchesSignature(snap, file)).toBe(false);
    });
  });
});
