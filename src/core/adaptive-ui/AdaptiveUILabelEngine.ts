/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { adaptiveTerminologyEngine } from "./AdaptiveTerminologyEngine";

export class AdaptiveUILabelEngine {
  public translate(key: string, options?: { plural?: boolean; uppercase?: boolean; abbreviate?: boolean }): string {
    if (!key || typeof key !== "string") return "";
    const term = adaptiveTerminologyEngine.getTerm(key);
    if (!term) return key;

    let label = (options?.plural ? term.displayPlural : term.displayLabel) || term.displayLabel || term.canonicalKey || key;

    if (options?.abbreviate && term.abbreviation) {
      label = term.abbreviation;
    }

    const safeLabel = typeof label === "string" ? label : (term.canonicalKey || key);

    if (options?.uppercase) {
      return safeLabel.toUpperCase();
    }

    return safeLabel;
  }

  public translateUILabel(key: string, options?: { plural?: boolean; uppercase?: boolean }): string {
    return this.translate(key, options);
  }

  public translateNarrativeText(text: string): string {
    return this.processHtmlSafely(text, (t) => {
      return this.processTextSafely(t, (txt) => {
        return this.replaceStaticTerms(txt);
      });
    });
  }

  public translatePresentationText(text: string): string {
    return this.processHtmlSafely(text, (t) => {
      return this.processTextSafely(t, (txt) => {
        return this.replaceStaticTerms(txt);
      });
    });
  }

  public shouldBypassText(text: string): boolean {
    if (!text || typeof text !== "string") return true;

    // Bypass emails
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) return true;

    // Bypass URLs
    if (/\b(https?:\/\/|www\.)\S+/.test(text)) return true;

    // Bypass file names with extensions (xls, xlsx, csv, txt, pdf)
    if (/\b\w+\.(xls|xlsx|csv|txt|pdf|json|xml)\b/i.test(text)) return true;

    return false;
  }

  public processTextSafely(text: string, translateFn: (t: string) => string): string {
    if (!text || typeof text !== "string") return text;

    // Split and isolate lineage blocks safely
    const lineageRegex = /(\[Linha de Dados:[^\]]+\]|\[Configuração do Workbook\]|\[Mapeamento de colunas\])/g;
    const parts = text.split(lineageRegex);

    return parts
      .map(part => {
        if (lineageRegex.test(part)) return part;
        if (this.shouldBypassText(part)) return part;
        return translateFn(part);
      })
      .join("");
  }

  public processHtmlSafely(text: string, translateFn: (t: string) => string): string {
    if (!text || typeof text !== "string") return text;
    const htmlRegex = /(<[^>]+>)/g;
    const parts = text.split(htmlRegex);

    return parts
      .map(part => {
        if (htmlRegex.test(part)) return part;
        return translateFn(part);
      })
      .join("");
  }

  public replaceStaticTerms(text: string): string {
    if (!text || typeof text !== "string") return text;

    let result = text;

    // Strict word boundary replacements for plural terms
    result = this.replaceCasePreserved(result, /\bcomissões\b/gi, this.translate("commission", { plural: true }));
    result = this.replaceCasePreserved(result, /\bclientes\b/gi, this.translate("customer", { plural: true }));
    result = this.replaceCasePreserved(result, /\bvendedores\b/gi, this.translate("seller", { plural: true }));
    result = this.replaceCasePreserved(result, /\bdepartamentos\b/gi, this.translate("department", { plural: true }));
    result = this.replaceCasePreserved(result, /\bfiliais\b/gi, this.translate("branch", { plural: true }));
    result = this.replaceCasePreserved(result, /\blojas\b/gi, this.translate("branch", { plural: true }));
    result = this.replaceCasePreserved(result, /\bempresas\b/gi, this.translate("company", { plural: true }));
    result = this.replaceCasePreserved(result, /\bgrupos\b/gi, this.translate("group", { plural: true }));
    result = this.replaceCasePreserved(result, /\bcolaboradores\b/gi, this.translate("people", { plural: true }));
    result = this.replaceCasePreserved(result, /\bfuncionários\b/gi, this.translate("people", { plural: true }));
    result = this.replaceCasePreserved(result, /\bpessoas\b/gi, this.translate("people", { plural: true }));
    result = this.replaceCasePreserved(result, /\bdashboards\b/gi, this.translate("dashboard", { plural: true }));
    result = this.replaceCasePreserved(result, /\bpainéis\b/gi, this.translate("dashboard", { plural: true }));
    result = this.replaceCasePreserved(result, /\brelatórios\b/gi, this.translate("report", { plural: true }));
    result = this.replaceCasePreserved(result, /\bdossiês\b/gi, this.translate("report", { plural: true }));
    result = this.replaceCasePreserved(result, /\breuniões\b/gi, this.translate("meeting", { plural: true }));
    result = this.replaceCasePreserved(result, /\bcomitês\b/gi, this.translate("meeting", { plural: true }));
    result = this.replaceCasePreserved(result, /\bapresentações\b/gi, this.translate("presentation", { plural: true }));
    result = this.replaceCasePreserved(result, /\bdecks\b/gi, this.translate("presentation", { plural: true }));

    // Strict word boundary replacements for singular terms
    result = this.replaceCasePreserved(result, /\bcomissão\b/gi, this.translate("commission", { plural: false }));
    result = this.replaceCasePreserved(result, /\bcliente\b/gi, this.translate("customer", { plural: false }));
    result = this.replaceCasePreserved(result, /\bvendedor\b/gi, this.translate("seller", { plural: false }));
    result = this.replaceCasePreserved(result, /\bdepartamento\b/gi, this.translate("department", { plural: false }));
    result = this.replaceCasePreserved(result, /\bfilial\b/gi, this.translate("branch", { plural: false }));
    result = this.replaceCasePreserved(result, /\bloja\b/gi, this.translate("branch", { plural: false }));
    result = this.replaceCasePreserved(result, /\bempresa\b/gi, this.translate("company", { plural: false }));
    result = this.replaceCasePreserved(result, /\bgrupo\b/gi, this.translate("group", { plural: false }));
    result = this.replaceCasePreserved(result, /\bcolaborador\b/gi, this.translate("people", { plural: false }));
    result = this.replaceCasePreserved(result, /\bfuncionário\b/gi, this.translate("people", { plural: false }));
    result = this.replaceCasePreserved(result, /\bpessoa\b/gi, this.translate("people", { plural: false }));
    result = this.replaceCasePreserved(result, /\bdashboard\b/gi, this.translate("dashboard", { plural: false }));
    result = this.replaceCasePreserved(result, /\bpainel\b/gi, this.translate("dashboard", { plural: false }));
    result = this.replaceCasePreserved(result, /\brelatório\b/gi, this.translate("report", { plural: false }));
    result = this.replaceCasePreserved(result, /\bdossiê\b/gi, this.translate("report", { plural: false }));
    result = this.replaceCasePreserved(result, /\breunião\b/gi, this.translate("meeting", { plural: false }));
    result = this.replaceCasePreserved(result, /\bcomitê\b/gi, this.translate("meeting", { plural: false }));
    result = this.replaceCasePreserved(result, /\bapresentação\b/gi, this.translate("presentation", { plural: false }));
    result = this.replaceCasePreserved(result, /\bdeck\b/gi, this.translate("presentation", { plural: false }));

    return result;
  }

  private replaceCasePreserved(text: string, regex: RegExp, replacement: string): string {
    if (typeof text !== "string") return "";
    const safeReplacement = typeof replacement === "string" ? replacement : "";
    if (!safeReplacement) return text;

    return text.replace(regex, (match) => {
      if (!match) return safeReplacement;
      if (match === match.toUpperCase()) {
        return safeReplacement.toUpperCase();
      }
      if (match.charAt && match.charAt(0) === match.charAt(0).toUpperCase()) {
        if (safeReplacement.charAt && safeReplacement.length > 0) {
          return safeReplacement.charAt(0).toUpperCase() + safeReplacement.slice(1);
        }
      }
      return safeReplacement.toLowerCase();
    });
  }
}

export const adaptiveUILabelEngine = new AdaptiveUILabelEngine();
export default adaptiveUILabelEngine;
