/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryProvider } from "./IPersistenceProvider";
import {
  WorkspaceRepository,
  StoryRepository,
  MeetingRepository,
  PeopleRepository,
  AnalyticsRepository,
  CompensationRepository,
  ActionPlanRepository,
} from "./IRepository";
import { UnitOfWork } from "./UnitOfWork";
import { TransactionManager } from "./TransactionManager";
import { DomainCache, cacheRegistry } from "./CacheLayer";
import { OfflineEngine } from "./OfflineEngine";
import { SnapshotEngine } from "./SnapshotEngine";
import { PersistenceObservability } from "./PersistenceObservability";

describe("Sauron Persistence Platform (Foundation F4) Test Suite", () => {
  let memoryProvider: MemoryProvider;

  beforeEach(() => {
    memoryProvider = new MemoryProvider();
    cacheRegistry.flushAll();
  });

  // ============================================================================
  // F4-A: PERSISTENCE PROVIDER TESTS
  // ============================================================================
  describe("F4-A — Persistence Provider", () => {
    it("manages standard key-value items correctly", async () => {
      await memoryProvider.setItem("test_key", "sauron_payload");
      const val = await memoryProvider.getItem("test_key");
      expect(val).toBe("sauron_payload");

      await memoryProvider.removeItem("test_key");
      const deletedVal = await memoryProvider.getItem("test_key");
      expect(deletedVal).toBeNull();
    });

    it("supports structured query filtering matching criteria", async () => {
      const collection = "workspace_metadata";
      await memoryProvider.save(collection, "ws_1", { id: "ws_1", status: "active", tier: "enterprise" });
      await memoryProvider.save(collection, "ws_2", { id: "ws_2", status: "inactive", tier: "enterprise" });
      await memoryProvider.save(collection, "ws_3", { id: "ws_3", status: "active", tier: "basic" });

      const all = await memoryProvider.query<any>(collection);
      expect(all.length).toBe(3);

      const activeEnterprise = await memoryProvider.query<any>(collection, { status: "active", tier: "enterprise" });
      expect(activeEnterprise.length).toBe(1);
      expect(activeEnterprise[0].id).toBe("ws_1");
    });
  });

  // ============================================================================
  // F4-B: REPOSITORIES TESTS
  // ============================================================================
  describe("F4-B — Domain Repositories", () => {
    it("restricts domain data manipulation without exposing provider internals", async () => {
      const workspaceRepo = new WorkspaceRepository(memoryProvider);
      const storyRepo = new StoryRepository(memoryProvider);
      const actionPlanRepo = new ActionPlanRepository(memoryProvider);

      // Save workspaces
      await workspaceRepo.save({ id: "ws_arcanjo", name: "Grupo Arcanjo", tenantId: "tenant_alpha" });
      await workspaceRepo.save({ id: "ws_topazio", name: "Grupo Topázio", tenantId: "tenant_beta" });

      const tenantAlphaWorkspaces = await workspaceRepo.getWorkspacesByTenant("tenant_alpha");
      expect(tenantAlphaWorkspaces.length).toBe(1);
      expect(tenantAlphaWorkspaces[0].name).toBe("Grupo Arcanjo");

      // Save stories
      await storyRepo.save({ id: "st_1", title: "Análise Financeira", workspaceId: "ws_arcanjo", isApproved: false });
      await storyRepo.save({ id: "st_2", title: "Review Tributário", workspaceId: "ws_arcanjo", isApproved: true });

      const arcanjoStories = await storyRepo.getStoriesByWorkspace("ws_arcanjo");
      expect(arcanjoStories.length).toBe(2);

      const pendingStories = await storyRepo.getPendingApprovalStories();
      expect(pendingStories.length).toBe(1);
      expect(pendingStories[0].title).toBe("Análise Financeira");

      // Action plan queries
      await actionPlanRepo.save({ id: "act_1", description: "Auditar Custo Fixo", responsible: "carlos@sauron.com" });
      const carlosActions = await actionPlanRepo.getActionsByResponsible("carlos@sauron.com");
      expect(carlosActions.length).toBe(1);
    });
  });

  // ============================================================================
  // F4-C: UNIT OF WORK TESTS
  // ============================================================================
  describe("F4-C — Unit Of Work Pattern", () => {
    it("coordinates multi-repository writes and commits them atomically", async () => {
      const workspaceRepo = new WorkspaceRepository(memoryProvider);
      const storyRepo = new StoryRepository(memoryProvider);
      const uow = new UnitOfWork();

      await uow.begin();

      const newWs = { id: "ws_uow_test", name: "Empresa UOW", tenantId: "tenant_xyz" };
      const newSt = { id: "st_uow_test", title: "Story UOW", workspaceId: "ws_uow_test", isApproved: false };

      uow.registerNew(newWs, workspaceRepo);
      uow.registerNew(newSt, storyRepo);

      // Verify that changes are NOT persisted before commit
      const preCommitWs = await workspaceRepo.getById("ws_uow_test");
      expect(preCommitWs).toBeNull();

      await uow.commit({ userId: "carlos_director", correlationId: "tx_1234" });

      // Verify changes are now persisted
      const postCommitWs = await workspaceRepo.getById("ws_uow_test");
      expect(postCommitWs).not.toBeNull();
      expect(postCommitWs.name).toBe("Empresa UOW");
    });

    it("executes comprehensive rollbacks and restores previous snapshots on failure", async () => {
      const workspaceRepo = new WorkspaceRepository(memoryProvider);
      const uow = new UnitOfWork();

      // Establish initial state
      const initialWs = { id: "ws_rollback", name: "Alpha original", tenantId: "tenant_1" };
      await workspaceRepo.save(initialWs);

      await uow.begin();

      // Register changes
      const updatedWs = { id: "ws_rollback", name: "Alpha edited", tenantId: "tenant_1" };
      uow.registerDirty(updatedWs, workspaceRepo, initialWs);

      const invalidWs = { id: "ws_invalid", name: null }; // Will throw error in validation
      uow.registerNew(invalidWs, {
        save: async () => {
          throw new Error("Validation violation: name cannot be null!");
        },
        getById: async () => null,
        delete: async () => {},
        getAll: async () => [],
        query: async () => [],
      });

      // Try commit, should trigger rollback
      await expect(
        uow.commit({ userId: "carlos_director", correlationId: "tx_error" })
      ).rejects.toThrow("Validation violation: name cannot be null!");

      // Verify that original state has been restored and edits reverted
      const revertedWs = await workspaceRepo.getById("ws_rollback");
      expect(revertedWs.name).toBe("Alpha original");
    });
  });

  // ============================================================================
  // F4-D: TRANSACTION MANAGER TESTS
  // ============================================================================
  describe("F4-D — Transaction Manager", () => {
    it("automates transaction boundaries and respects NEVER propagation levels", async () => {
      const uow = new UnitOfWork();
      const txManager = new TransactionManager(uow);

      // Execute standard REQUIRED transaction
      const result = await txManager.executeInTransaction(async (uowCtx) => {
        expect(uowCtx.isTransactionActive()).toBe(true);
        return "SUCCESS";
      });
      expect(result).toBe("SUCCESS");

      // Verify NEVER triggers error inside active transaction
      await txManager.executeInTransaction(async (activeUow) => {
        await expect(
          txManager.executeInTransaction(async () => {}, { propagation: "NEVER" })
        ).rejects.toThrow("Active transaction detected under PROPAGATION=NEVER.");
      });
    });
  });

  // ============================================================================
  // F4-E: CACHE LAYER TESTS
  // ============================================================================
  describe("F4-E — Cache Layer with LRU Eviction & TTL", () => {
    it("successfully tracks cache hits and cache misses", () => {
      const cache = new DomainCache<any>("TestCache", 3, 1000); // Max size 3

      // Misses check
      expect(cache.get("non_existent")).toBeNull();
      expect(cache.getStats().misses).toBe(1);

      // Hits check
      cache.set("k1", "val1");
      expect(cache.get("k1")).toBe("val1");
      expect(cache.getStats().hits).toBe(1);
    });

    it("enforces LRU eviction when size bounds are exceeded", () => {
      const cache = new DomainCache<any>("TestCache", 2, 10000); // Max size 2

      cache.set("k1", "first");
      cache.set("k2", "second");

      // Access key 1 to make it recently used
      cache.get("k1");

      // Insert third item, triggering eviction of oldest unused (which is k2)
      cache.set("k3", "third");

      expect(cache.get("k1")).toBe("first");
      expect(cache.get("k2")).toBeNull(); // Evicted!
      expect(cache.get("k3")).toBe("third");
      expect(cache.getStats().evictionCount).toBe(1);
    });

    it("respects expiration TTL thresholds", async () => {
      // 10ms TTL
      const cache = new DomainCache<any>("QuickCache", 5, 10);
      cache.set("expired_key", "old");

      // Wait 15ms for TTL expiry
      await new Promise((resolve) => setTimeout(resolve, 15));

      expect(cache.get("expired_key")).toBeNull();
    });
  });

  // ============================================================================
  // F4-F & F4-G: OFFLINE ENGINE & CONFLICT RESOLUTION TESTS
  // ============================================================================
  describe("F4-F & F4-G — Offline Sync & Conflict Resolution Strategies", () => {
    let localProvider: MemoryProvider;
    let serverProvider: MemoryProvider;
    let offlineEngine: OfflineEngine;

    beforeEach(() => {
      localProvider = new MemoryProvider();
      serverProvider = new MemoryProvider();
      offlineEngine = new OfflineEngine(localProvider);
    });

    it("buffers operations locally while offline and pushes them once online", async () => {
      offlineEngine.setOnline(false);

      // Queue edits offline
      await offlineEngine.queueOperation({
        action: "CREATE",
        collection: "story",
        recordId: "st_off_1",
        payload: { id: "st_off_1", title: "Offline Story", version: 1 },
      });

      expect(offlineEngine.getQueueLength()).toBe(1);

      // Reconnect and synchronize
      offlineEngine.setOnline(true);
      const report = await offlineEngine.synchronize(serverProvider);

      expect(report.syncedOpsCount).toBe(1);
      expect(offlineEngine.getQueueLength()).toBe(0);

      // Verify stored on server
      const serverRecord = await serverProvider.getItem("story:st_off_1");
      expect(serverRecord).not.toBeNull();
      expect(JSON.parse(serverRecord!).title).toBe("Offline Story");
    });

    it("resolves conflicts using LAST_WRITE_WINS strategy", async () => {
      // Establish existing server state
      await serverProvider.setItem("story:st_conf", JSON.stringify({ id: "st_conf", title: "Server Title" }));

      offlineEngine.setOnline(false);
      await offlineEngine.queueOperation({
        action: "UPDATE",
        collection: "story",
        recordId: "st_conf",
        payload: { id: "st_conf", title: "Local Title Wins" },
      });

      offlineEngine.setOnline(true);
      const report = await offlineEngine.synchronize(serverProvider, "LAST_WRITE_WINS");

      expect(report.conflictsDetected).toBe(1);
      expect(report.resolvedOpsCount).toBe(1);

      const serverRecord = await serverProvider.getItem("story:st_conf");
      expect(JSON.parse(serverRecord!).title).toBe("Local Title Wins");
    });

    it("resolves conflicts using MERGE strategy", async () => {
      await serverProvider.setItem(
        "story:st_conf",
        JSON.stringify({ id: "st_conf", title: "Server Title", department: "Finance" })
      );

      offlineEngine.setOnline(false);
      await offlineEngine.queueOperation({
        action: "UPDATE",
        collection: "story",
        recordId: "st_conf",
        payload: { id: "st_conf", title: "Updated Local Title", author: "Carlos" },
      });

      offlineEngine.setOnline(true);
      await offlineEngine.synchronize(serverProvider, "MERGE");

      const serverRecord = JSON.parse((await serverProvider.getItem("story:st_conf"))!);
      expect(serverRecord.title).toBe("Updated Local Title"); // overwritten
      expect(serverRecord.department).toBe("Finance"); // preserved
      expect(serverRecord.author).toBe("Carlos"); // added
    });

    it("quarantines conflicting items under MANUAL_REVIEW strategy", async () => {
      await serverProvider.setItem("story:st_conf", JSON.stringify({ id: "st_conf", value: 100 }));

      offlineEngine.setOnline(false);
      await offlineEngine.queueOperation({
        action: "UPDATE",
        collection: "story",
        recordId: "st_conf",
        payload: { id: "st_conf", value: 150 },
      });

      offlineEngine.setOnline(true);
      const report = await offlineEngine.synchronize(serverProvider, "MANUAL_REVIEW");

      expect(report.quarantinedOpsCount).toBe(1);
      expect(offlineEngine.getQuarantinedRecords().has("story:st_conf")).toBe(true);

      // Verify server record remains unmodified
      const serverRecord = JSON.parse((await serverProvider.getItem("story:st_conf"))!);
      expect(serverRecord.value).toBe(100);
    });

    it("resolves conflicts using VERSION_COMPARE optimistic locking strategy", async () => {
      // Server has version 2
      await serverProvider.setItem("story:st_conf", JSON.stringify({ id: "st_conf", value: 100, version: 2 }));

      offlineEngine.setOnline(false);
      
      // Local tries to write with version 1 (stale/rejected)
      await offlineEngine.queueOperation({
        action: "UPDATE",
        collection: "story",
        recordId: "st_conf",
        payload: { id: "st_conf", value: 150 },
        version: 1,
      });

      offlineEngine.setOnline(true);
      await offlineEngine.synchronize(serverProvider, "VERSION_COMPARE");

      // Verify rejected (keeps server values)
      let serverRecord = JSON.parse((await serverProvider.getItem("story:st_conf"))!);
      expect(serverRecord.value).toBe(100);

      // Now queue operation with version 3 (valid/newer)
      offlineEngine.setOnline(false);
      await offlineEngine.queueOperation({
        action: "UPDATE",
        collection: "story",
        recordId: "st_conf",
        payload: { id: "st_conf", value: 200 },
        version: 3,
      });

      offlineEngine.setOnline(true);
      await offlineEngine.synchronize(serverProvider, "VERSION_COMPARE");

      // Verify accepted
      serverRecord = JSON.parse((await serverProvider.getItem("story:st_conf"))!);
      expect(serverRecord.value).toBe(200);
      expect(serverRecord.version).toBe(3);
    });
  });

  // ============================================================================
  // F4-H: SNAPSHOT ENGINE TESTS
  // ============================================================================
  describe("F4-H — Snapshot Replay Engine", () => {
    it("captures state freezes, builds timeline, and rolls back to past snapshots", () => {
      const snapEngine = new SnapshotEngine();
      const entityId = "meeting_strategy_1";

      const stateV1 = { id: entityId, agenda: "Definir margem", status: "open" };
      const snap1 = snapEngine.captureSnapshot("meetings", entityId, stateV1, "Carlos Diretor", "Reunião de abertura");

      const stateV2 = { id: entityId, agenda: "Definir margem e custos fixos", status: "completed" };
      const snap2 = snapEngine.captureSnapshot("meetings", entityId, stateV2, "Carlos Diretor", "Conclusão");

      const history = snapEngine.getHistory(entityId);
      expect(history.length).toBe(2);
      expect(history[0].checksum).toContain("SOP-SNAP-");

      // Replay timeline check
      const timeline = snapEngine.replayTimeline(entityId);
      expect(timeline[1].notes).toBe("Conclusão");
      expect(timeline[0].state.agenda).toBe("Definir margem");

      // Rollback verification
      const restored = snapEngine.rollbackToSnapshot(entityId, snap1.snapshotId);
      expect(restored.payload.agenda).toBe("Definir margem");
      expect(restored.payload.status).toBe("open");
    });
  });

  // ============================================================================
  // F4-I: OBSERVABILITY METRICS TESTS
  // ============================================================================
  describe("F4-I — Persistence Observability", () => {
    it("monitors operational statistics and measures read/write counts", () => {
      const obs = new PersistenceObservability();

      obs.recordRead(12.5);
      obs.recordRead(8.1);
      obs.recordWrite(45.0);
      obs.recordWrite(35.0);
      obs.recordCacheHit();
      obs.recordCacheMiss();
      obs.recordRollback();
      obs.recordRetry();
      obs.recordSyncJob();

      const metrics = obs.getMetrics();
      expect(metrics.totalReadOps).toBe(2);
      expect(metrics.totalWriteOps).toBe(2);
      expect(metrics.averageReadLatencyMs).toBe(10.3); // (12.5 + 8.1) / 2
      expect(metrics.averageWriteLatencyMs).toBe(40.0); // (45.0 + 35.0) / 2
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.rollbacksTriggered).toBe(1);
      expect(metrics.retriesAttempted).toBe(1);
      expect(metrics.syncJobsExecuted).toBe(1);
    });
  });
});
