import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NTestPage from "@/pages/user/NTestPage";
import { getPublicExperimentById } from "@/services/eyetrackingService";
import { useEyeTracking } from "@/hooks/useEyeTracking";

vi.mock("@/services/eyetrackingService");
vi.mock("@/hooks/useEyeTracking");

vi.mock("@/pages/user/steps/NTestStepWelcome", async () => ({ default: () => (
  <div>StepWelcome</div>
) }));

vi.mock("@/pages/user/steps/NTestStepTutorial", async () => ({ default: () => (
  <div>StepTutorial</div>
) }));

vi.mock("@/pages/user/steps/NTestStepAlignment", async () => ({ default: () => (
  <div>StepAlignment</div>
) }));

vi.mock("@/pages/user/steps/NTestStepCalibration", async () => ({ default: () => (
  <div>StepCalibration</div>
) }));

vi.mock("@/pages/user/steps/NTestStepRunner", async () => ({ default: () => (
  <div>StepRunner</div>
) }));

vi.mock("@/pages/user/steps/NTestStepResult", async () => ({ default: () => (
  <div>StepResult</div>
) }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "exp-1" }),
  };
});

describe("NTestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEyeTracking.mockReturnValue({
      mediaStream: null,
      cameraActive: false,
      faceValid: false,
      mpLoaded: true,
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
      addCalibrationPoint: vi.fn(),
      finalizeCalibration: vi.fn(),
      getCurrentGaze: vi.fn(),
    });
  });

  it("shows loading state", () => {
    getPublicExperimentById.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <NTestPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/carregando teste/i)).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    getPublicExperimentById.mockRejectedValueOnce(new Error("Falha"));

    render(
      <MemoryRouter>
        <NTestPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/carregar este teste/i)).toBeInTheDocument();
    });
  });

  it("renders initial step when data loads", async () => {
    getPublicExperimentById.mockResolvedValueOnce({
      id: "exp-1",
      experiment: {
        basic: { name: "Teste" },
        identification: { required: false, mode: "nome" },
        participants: [],
        samples: [],
        pieces: [],
        organization: {},
      },
    });

    render(
      <MemoryRouter>
        <NTestPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/stepwelcome/i)).toBeInTheDocument();
    });
  });
});
