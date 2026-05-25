import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import NTestStepResult from "@/pages/user/steps/NTestStepResult";
import { createEyeTrackingSession } from "@/services/eyetrackingService";

vi.mock("@/services/eyetrackingService", async () => ({
  createEyeTrackingSession: vi.fn(),
}));

describe("NTestStepResult", () => {
  beforeEach(() => {
    createEyeTrackingSession.mockReset();
    Object.defineProperty(global, "crypto", {
      value: { randomUUID: vi.fn(() => "uuid-1") },
      configurable: true,
    });
  });

  it("shows success when session is saved", async () => {
    createEyeTrackingSession.mockResolvedValueOnce({});

    render(
      <NTestStepResult
        experimentId="exp-1"
        participantInfo={{ nome: "Ana", cpf: "123" }}
        sessionData={[]}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/muito obrigado por participar/i),
      ).toBeInTheDocument();
    });
  });

  it("shows error when saving fails", async () => {
    createEyeTrackingSession.mockRejectedValueOnce(new Error("Falha"));

    render(
      <NTestStepResult
        experimentId="exp-1"
        participantInfo={{ nome: "Ana", cpf: "123" }}
        sessionData={[]}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/foi poss.vel enviar os dados/i),
      ).toBeInTheDocument();
    });
  });
});
