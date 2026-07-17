/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceProject } from "../../modules/consultant-workspace/types";
import { EmployeeProfile, ExecutiveDossier } from "../../modules/people/types";
import { peopleManager } from "../../modules/people/PeopleManager";

export interface CaseDossierReport {
  caseId: string;
  caseName: string;
  client: string;
  group: string;
  segment: string;
  companies: string[];
  cnpjs: string[];
  connectedDataSources: Array<{ id: string; name: string; type: string }>;
  kpis: Array<{ name: string; target: number; current?: number }>;
  anomalies: any[];
  decisions: string[];
  plans: any[];
  meetings: any[];
  presentations: any[];
  people: {
    employees: EmployeeProfile[];
    dossiers: ExecutiveDossier[];
  };
  history: any[];
  dataSourceTrace: string;
  generatedAt: string;
}

export class CaseDossierEngine {
  private static instance: CaseDossierEngine;

  private constructor() {}

  public static getInstance(): CaseDossierEngine {
    if (!CaseDossierEngine.instance) {
      CaseDossierEngine.instance = new CaseDossierEngine();
    }
    return CaseDossierEngine.instance;
  }

  /**
   * Generates a structural consulting dossier by aggregating all elements associated with a specific case.
   */
  public generateDossier(project: WorkspaceProject): CaseDossierReport {
    const employees = peopleManager.getAllEmployees();
    const dossiers = peopleManager.getDossiers();

    // Retrieve decisions from all logged meetings
    const decisions: string[] = [];
    if (project.meetings) {
      project.meetings.forEach(m => {
        if (m.decisions) {
          decisions.push(m.decisions);
        }
      });
    }

    // Unify connected datasets
    const connectedDataSources: Array<{ id: string; name: string; type: string }> = [];
    if (project.spreadsheets) {
      project.spreadsheets.forEach(s => {
        connectedDataSources.push({ id: s.id, name: s.name, type: "Planilha" });
      });
    }
    if (project.dbConnections) {
      project.dbConnections.forEach(db => {
        connectedDataSources.push({ id: db.id, name: db.name, type: "Banco de Dados SQL" });
      });
    }

    // Collect trace of data source origin
    let dataSourceTrace = "Nenhuma fonte de dados vinculada.";
    if (project.spreadsheets && project.spreadsheets.length > 0) {
      dataSourceTrace = project.spreadsheets.map(s => s.name).join(", ");
    } else if (project.dbConnections && project.dbConnections.length > 0) {
      dataSourceTrace = project.dbConnections.map(db => db.name).join(", ");
    }

    return {
      caseId: project.id,
      caseName: project.client || "Caso Sem Nome",
      client: project.client || "Cliente Desconhecido",
      group: project.group || "Grupo Desconhecido",
      segment: project.segment || "Geral",
      companies: project.companies || [],
      cnpjs: project.cnpjs || [],
      connectedDataSources,
      kpis: project.kpis ? project.kpis.map(k => ({ name: k.name, target: k.target })) : [],
      anomalies: project.analysis?.anomalies || [],
      decisions,
      plans: project.actionPlans || [],
      meetings: project.meetings || [],
      presentations: project.presentations || [],
      people: {
        employees,
        dossiers
      },
      history: project.history || [],
      dataSourceTrace,
      generatedAt: new Date().toISOString()
    };
  }
}

export const caseDossierEngine = CaseDossierEngine.getInstance();
export default caseDossierEngine;
