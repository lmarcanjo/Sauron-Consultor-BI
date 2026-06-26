/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DepartmentTwin {
  id: string;
  name: string;
  managerUserId?: string;
  costCenters: string[]; // costCenter IDs or names
}

export interface StoreTwin {
  id: string;
  name: string;
  cnpj: string;
  brand: string;
  city: string;
  state: string;
  managerUserId?: string;
  departments: DepartmentTwin[];
  activeHeadcount: number;
}

export interface BrandTwin {
  id: string;
  name: string;
  segment: string; // e.g. "automotivo", "servicos", etc.
  stores: string[]; // StoreTwin IDs
}

export interface CompanyTwin {
  id: string;
  name: string;
  legalName: string;
  taxId: string; // CNPJ principal
  brands: BrandTwin[];
  stores: StoreTwin[];
  costCenters: string[];
}

export interface BusinessGroupTwin {
  id: string;
  name: string;
  ownerUserId: string;
  companies: CompanyTwin[];
  headquartersAddress?: string;
  createdAt: string;
}
