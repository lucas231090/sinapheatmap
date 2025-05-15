/**
 * Testes de integração para o componente HeatmapVideo
 * Verifica a renderização e comportamento geral da página de vídeo de heatmap
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HeatmapVideo from "../HeatmapVideo";

// Mock para o hook useHeatmapVideo
jest.mock("../../../hooks/useHeatmapVideo");

// Mock para o componente Player do Remotion
jest.mock("@remotion/player", () => ({
  Player: jest.fn((props) => (
    <div data-testid="remotion-player">
      <button onClick={() => props.onPlay()} data-testid="play-button">
        Play
      </button>
      <button onClick={() => props.onPause()} data-testid="pause-button">
        Pause
      </button>
    </div>
  )),
}));

// Mock para o componente VideoControls
jest.mock("../../../components/Heatmap/VideoControls", () => {
  return jest.fn((props) => (
    <div data-testid="video-controls-mock">
      <button
        data-testid="test-select-button"
        onClick={() => props.setSelectedTestIndex("1")}
      >
        Select Test 1
      </button>
      <button data-testid="start-video-button" onClick={props.onVideoStart}>
        Start Video
      </button>
      <select
        data-testid="speed-selector"
        value={props.playbackSpeed}
        onChange={(e) => props.setPlaybackSpeed(parseFloat(e.target.value))}
      >
        <option value="1">1x</option>
        <option value="2">2x</option>
      </select>
    </div>
  ));
});

// Mock for the config to avoid import.meta.env issues
jest.mock("../../../../config", () => ({
  default: {
    API_BASE_URL: "http://localhost:3000",
  },
}));

// Import the mock function after the mock is defined
import useHeatmapVideo from "../../../hooks/useHeatmapVideo";

describe("HeatmapVideo Component", () => {
  const mockHeatmapData = {
    playerRef: { current: null },
    isPlaying: false,
    setIsPlaying: jest.fn(),
    showPlayer: false,
    setShowPlayer: jest.fn(),
    playbackSpeed: 1,
    setPlaybackSpeed: jest.fn(),
    playerKey: 0,
    fileName: "Test Video",
    dataFile: { jsonData: [{ test: "data1" }, { test: "data2" }] },
    img: "test-image-url",
    width: 1280,
    height: 720,
    totalFrames: 300,
    hasValidData: true,
    heatmapData: {
      coords: [{ x: 100, y: 150, value: 50 }],
      radiusScale: 1,
      canvasSize: { width: 1280, height: 720 },
    },
    handleTestSelect: jest.fn().mockImplementation((index) => index),
    handleVideoStart: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Configura o mock do hook para retornar os dados simulados
    useHeatmapVideo.mockReturnValue(mockHeatmapData);
  });

  // Função helper para renderizar o componente com o router
  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={["/heatmap-video/123"]}>
        <Routes>
          <Route path="/heatmap-video/:id" element={<HeatmapVideo />} />
        </Routes>
      </MemoryRouter>
    );
  };

  // Testa a renderização inicial
  test("renders loading state when no test is selected", () => {
    renderWithRouter();

    // Verifica se o título é renderizado
    expect(screen.getByText(/Eyetracking Heatmap:/)).toBeInTheDocument();

    // Verifica se os controles de vídeo são renderizados
    expect(screen.getByTestId("video-controls-mock")).toBeInTheDocument();

    // Verifica se a mensagem para selecionar um teste é exibida
    expect(
      screen.getByText(/Selecione um teste para começar/)
    ).toBeInTheDocument();

    // Verifica que o player não está sendo exibido
    expect(screen.queryByTestId("remotion-player")).not.toBeInTheDocument();
  });

  // Testa o fluxo de seleção de teste e início do vídeo
  test("selects test and starts video", () => {
    // Atualiza o mock para simular dados carregados mas player não visível
    useHeatmapVideo.mockReturnValue({
      ...mockHeatmapData,
      showPlayer: false,
      hasValidData: true,
    });

    renderWithRouter();

    // Seleciona um teste
    fireEvent.click(screen.getByTestId("test-select-button"));

    // Verifica se handleTestSelect foi chamado
    expect(mockHeatmapData.handleTestSelect).toHaveBeenCalledWith("1");

    // Atualiza o mock para simular player visível após seleção
    useHeatmapVideo.mockReturnValue({
      ...mockHeatmapData,
      showPlayer: true,
      hasValidData: true,
    });

    // Rerender para atualizar o componente
    renderWithRouter();

    // Verifica se o player do Remotion é renderizado
    expect(screen.getByTestId("remotion-player")).toBeInTheDocument();
  });

  // Testa o controle de playback
  test("controls playback state", () => {
    // Configura o mock para mostrar o player
    useHeatmapVideo.mockReturnValue({
      ...mockHeatmapData,
      showPlayer: true,
      hasValidData: true,
    });

    renderWithRouter();

    // Verifica que o player é renderizado
    expect(screen.getByTestId("remotion-player")).toBeInTheDocument();

    // Simula o clique no botão de play
    fireEvent.click(screen.getByTestId("play-button"));

    // Verifica se setIsPlaying foi chamado com true
    expect(mockHeatmapData.setIsPlaying).toHaveBeenCalledWith(true);

    // Simula o clique no botão de pause
    fireEvent.click(screen.getByTestId("pause-button"));

    // Verifica se setIsPlaying foi chamado com false
    expect(mockHeatmapData.setIsPlaying).toHaveBeenCalledWith(false);
  });

  // Testa a mudança de velocidade
  test("changes playback speed", () => {
    // Configura o mock para mostrar o player
    useHeatmapVideo.mockReturnValue({
      ...mockHeatmapData,
      showPlayer: true,
      hasValidData: true,
    });

    renderWithRouter();

    // Seleciona uma velocidade diferente
    fireEvent.change(screen.getByTestId("speed-selector"), {
      target: { value: "2" },
    });

    // Verifica se setPlaybackSpeed foi chamado com o valor correto
    expect(mockHeatmapData.setPlaybackSpeed).toHaveBeenCalledWith(2);
  });
});
