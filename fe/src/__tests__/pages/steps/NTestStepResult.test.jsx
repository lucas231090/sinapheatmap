import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

        sessionData={[]}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/foi poss.vel enviar os dados/i),
      ).toBeInTheDocument();
    });
  });

  it("recovers and transitions to success even if re-rendered while request is in flight", async () => {
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    createEyeTrackingSession.mockReturnValueOnce(pendingPromise);

    const { rerender } = render(
      <NTestStepResult experimentId="exp-1" sessionData={[]} />,
    );

    expect(screen.getByText(/salvando seus resultados/i)).toBeInTheDocument();

    // Re-render while request is still pending
    rerender(
      <NTestStepResult
        experimentId="exp-1"
        sessionData={[]}
        participantData={{ idade: 30, genero: "Feminino" }}
      />,
    );

    // Resolve the promise
    resolvePromise({});

    await waitFor(() => {
      expect(
        screen.getByText(/muito obrigado por participar/i),
      ).toBeInTheDocument();
    });
  });

  it("allows retrying via 'Tentar novamente' button when save fails", async () => {
    createEyeTrackingSession
      .mockRejectedValueOnce(new Error("Falha temporária de rede"))
      .mockResolvedValueOnce({});

    render(<NTestStepResult experimentId="exp-1" sessionData={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: /tentar novamente/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/muito obrigado por participar/i),
      ).toBeInTheDocument();
    });
  });
});
