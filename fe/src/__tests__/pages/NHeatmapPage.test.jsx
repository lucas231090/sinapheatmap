import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NHeatmapPage from "@/pages/researcher/NHeatmapPage";
import { useHeatmapData } from "@/hooks/useHeatmapData";

vi.mock("@/hooks/useHeatmapData");

vi.mock("@/components/heatmap/NHeatmapStatic", async () => ({ default: () => (
  <div>HeatmapStatic</div>
) }));

vi.mock("@/components/heatmap/NHeatmapVideo", async () => ({ default: () => (
  <div>HeatmapVideo</div>
) }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "exp-1" }),
  };
});

describe("NHeatmapPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    useHeatmapData.mockReturnValue({
      experiment: null,
      sessions: [],
      isLoading: true,
      error: null,
      activePiece: null,
      selectedSampleId: "",
      setSelectedSampleId: vi.fn(),
      selectedPieceId: "",
      setSelectedPieceId: vi.fn(),
      selectedSessionId: "all",
      setSelectedSessionId: vi.fn(),
      coords: [],
      radiusScale: 1,
      canvasSize: { width: 1280, height: 720 },
      captureFps: 60,
      timelineDurationMs: 0,
    });

    render(
      <MemoryRouter>
        <NHeatmapPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/carregando dados do heatmap/i),
    ).toBeInTheDocument();
  });

  it("renders error state", () => {
    useHeatmapData.mockReturnValue({
      experiment: null,
      sessions: [],
      isLoading: false,
      error: "Erro ao carregar",
      activePiece: null,
      selectedSampleId: "",
      setSelectedSampleId: vi.fn(),
      selectedPieceId: "",
      setSelectedPieceId: vi.fn(),
      selectedSessionId: "all",
      setSelectedSessionId: vi.fn(),
      coords: [],
      radiusScale: 1,
      canvasSize: { width: 1280, height: 720 },
      captureFps: 60,
      timelineDurationMs: 0,
    });

    render(
      <MemoryRouter>
        <NHeatmapPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
  });

  it("renders heatmap content when data is available", () => {
    useHeatmapData.mockReturnValue({
      experiment: {
        jsonData: { basic: { name: "Teste", isImported: false }, samples: [] },
        filename: "Teste",
      },
      sessions: [],
      isLoading: false,
      error: null,
      activePiece: { previewKind: "image", exposureSeconds: 10 },
      selectedSampleId: "",
      setSelectedSampleId: vi.fn(),
      selectedPieceId: "",
      setSelectedPieceId: vi.fn(),
      selectedSessionId: "all",
      setSelectedSessionId: vi.fn(),
      coords: [],
      radiusScale: 1,
      canvasSize: { width: 1280, height: 720 },
      captureFps: 60,
      timelineDurationMs: 0,
    });

    render(
      <MemoryRouter>
        <NHeatmapPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/heatmap: teste/i)).toBeInTheDocument();
    expect(screen.getByText(/heatmapstatic/i)).toBeInTheDocument();
    expect(screen.getByText(/mudar para v/i)).toBeInTheDocument();
  });
});
