import { describe, expect, it } from "vitest";
import { businessMeetingEngine } from "./BusinessMeetingEngine";
import "./index";

describe("BusinessMeetingEngine Unit Tests", () => {
  it("retrieves the meeting template of the agribusiness domain", () => {
    const mt = businessMeetingEngine.getMeetingTemplate("agribusiness");
    expect(mt).not.toBeNull();
    expect(mt?.subjectOrder).toContain("Produtividade por Talhão");
    expect(mt?.mandatoryKpis).toContain("PRODUCTION");
    expect(mt?.mandatoryKpis).toContain("PRODUCTIVITY");
    expect(mt?.mandatoryKpis).toContain("COST_HECTARE");
    expect(mt?.riscos.length).toBeGreaterThan(0);
    expect(mt?.acoes.length).toBeGreaterThan(0);
  });

  it("retrieves the meeting template of the automotive domain", () => {
    const mt = businessMeetingEngine.getMeetingTemplate("automotive");
    expect(mt).not.toBeNull();
    expect(mt?.subjectOrder).toContain("Passagem de Oficina");
    expect(mt?.mandatoryKpis).toContain("TICKET_MEDIO");
  });

  it("returns null for non-existing domain", () => {
    const mt = businessMeetingEngine.getMeetingTemplate("invalid-domain");
    expect(mt).toBeNull();
  });
});
