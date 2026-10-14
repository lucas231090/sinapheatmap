import { describe, it, expect } from "vitest";
import { formatSessionParticipantLabel } from "@/utils/heatmapUtils";

describe("formatSessionParticipantLabel", () => {
  it("formats session number without 'Anônimo' when demographic data is absent", () => {
    expect(formatSessionParticipantLabel({}, 0)).toBe("Sessão 1");
    expect(formatSessionParticipantLabel({ participante: { nome: "Anônimo" } }, 1)).toBe("Sessão 2");
    expect(formatSessionParticipantLabel({ participante: { nome: "Anonimo" } }, 2)).toBe("Sessão 3");
  });

  it("includes age when present", () => {
    expect(formatSessionParticipantLabel({ idade: 25 }, 0)).toBe("Sessão 1 (25 anos)");
    expect(formatSessionParticipantLabel({ age: 30 }, 1)).toBe("Sessão 2 (30 anos)");
  });

  it("includes gender when present", () => {
    expect(formatSessionParticipantLabel({ genero: "Feminino" }, 0)).toBe("Sessão 1 (Feminino)");
    expect(formatSessionParticipantLabel({ gender: "Masculino" }, 1)).toBe("Sessão 2 (Masculino)");
  });

  it("includes both age and gender when present", () => {
    expect(
      formatSessionParticipantLabel({ idade: 22, genero: "Feminino" }, 0),
    ).toBe("Sessão 1 (22 anos, Feminino)");
    expect(
      formatSessionParticipantLabel({ age: 45, gender: "Não-binário" }, 3),
    ).toBe("Sessão 4 (45 anos, Não-binário)");
  });

  it("preserves custom participant name when available and not Anônimo", () => {
    expect(
      formatSessionParticipantLabel({ participante: { nome: "Participante Alpha" } }, 0),
    ).toBe("Sessão 1 (Participante Alpha)");
  });
});
