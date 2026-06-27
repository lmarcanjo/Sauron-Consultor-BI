/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformUser, Organization, Workspace, Permission } from "../identity/types";
import { WorkspaceProject } from "../../modules/consultant-workspace/types";
import { WorkspaceContext, ContextEntity, ContextPeriod, ContextScope } from "./types";
import { permissionManager } from "../identity/PermissionManager";

export class ContextResolver {
  private static instance: ContextResolver;

  private constructor() {}

  public static getInstance(): ContextResolver {
    if (!ContextResolver.instance) {
      ContextResolver.instance = new ContextResolver();
    }
    return ContextResolver.instance;
  }

  /**
   * Resolves the complete context of the workspace based on various sub-states.
   */
  public resolveContext(
    currentUser: PlatformUser,
    currentOrg: Organization,
    currentWorkspace: Workspace | null,
    activeProject: WorkspaceProject | null,
    selectedPeriod: ContextPeriod | null,
    selectedEntity: ContextEntity | null,
    activeFilters: Record<string, string[] | undefined>,
    activeDataSource: string
  ): WorkspaceContext {
    // Resolve role permissions
    const permissions: Permission[] = permissionManager.getRolePermissions(currentUser.role);

    // Default values from active filters or selected entity
    let resolvedSegment = activeProject ? activeProject.segment : "Geral (Consultoria)";
    let resolvedGroup = activeProject ? activeProject.group : "Corporativo";
    let resolvedEmpresa: string | null = null;
    let resolvedCnpj: string | null = null;
    let resolvedMarca: string | null = null;
    let resolvedLoja: string | null = null;
    let resolvedDepartment: string | null = null;
    let resolvedCostCenter: string | null = null;
    let resolvedVendedor: { id: string; name: string; role?: string } | null = null;

    // Extrapolate from selectedEntity if it's specific
    if (selectedEntity) {
      if (selectedEntity.type === "company") {
        resolvedEmpresa = selectedEntity.name;
        resolvedCnpj = selectedEntity.id;
      } else if (selectedEntity.type === "store") {
        resolvedLoja = selectedEntity.name;
        if (selectedEntity.metadata?.brand) {
          resolvedMarca = selectedEntity.metadata.brand;
        }
      } else if (selectedEntity.type === "vendedor") {
        resolvedVendedor = {
          id: selectedEntity.id,
          name: selectedEntity.name,
          role: selectedEntity.metadata?.role || "Consultor de Vendas"
        };
        if (selectedEntity.metadata?.store) {
          resolvedLoja = selectedEntity.metadata.store;
        }
      } else if (selectedEntity.type === "group") {
        resolvedGroup = selectedEntity.name;
      } else if (selectedEntity.type === "organization") {
        resolvedGroup = selectedEntity.name;
      }
    }

    // Apply active filter overrides if present
    if (activeFilters.grupos && activeFilters.grupos.length > 0) {
      resolvedGroup = activeFilters.grupos[0];
    }
    if (activeFilters.cnpjs && activeFilters.cnpjs.length > 0) {
      resolvedCnpj = activeFilters.cnpjs[0];
    }
    if (activeFilters.marcas && activeFilters.marcas.length > 0) {
      resolvedMarca = activeFilters.marcas[0];
    }
    if (activeFilters.razoes && activeFilters.razoes.length > 0) {
      // E.g. Company Razão Social
      resolvedEmpresa = activeFilters.razoes[0];
    }

    // Access scope hierarchy
    let escopoDeAcesso: ContextScope = "global";
    if (currentUser.role === "Viewer" || currentUser.role === "Guest") {
      escopoDeAcesso = "store";
    } else if (selectedEntity) {
      if (selectedEntity.type === "store") {
        escopoDeAcesso = "store";
      } else if (selectedEntity.type === "vendedor") {
        escopoDeAcesso = "vendedor";
      } else if (selectedEntity.type === "case") {
        escopoDeAcesso = "workspace";
      } else if (selectedEntity.type === "organization") {
        escopoDeAcesso = "organization";
      }
    } else if (currentWorkspace) {
      escopoDeAcesso = "workspace";
    } else {
      escopoDeAcesso = "organization";
    }

    const modoDemoReal: "demo" | "real" = activeDataSource === "DEMO_DATA" ? "demo" : "real";

    return {
      currentUser,
      currentOrganization: currentOrg,
      currentCase: activeProject ? { id: activeProject.id, name: activeProject.client } : null,
      currentWorkspace,
      currentPeriod: selectedPeriod || { id: "junho_2026", name: "Junho/2026" },
      segmento: resolvedSegment,
      grupo: resolvedGroup,
      empresa: resolvedEmpresa,
      CNPJ: resolvedCnpj,
      marca: resolvedMarca,
      loja: resolvedLoja,
      departamento: resolvedDepartment,
      centroDeCusto: resolvedCostCenter,
      vendedor: resolvedVendedor,
      permissions,
      filtrosAtivos: activeFilters,
      fonteDeDadosAtiva: activeDataSource,
      modoDemoReal,
      escopoDeAcesso,
      entidadeSelecionada: selectedEntity
    };
  }
}

export const contextResolver = ContextResolver.getInstance();
