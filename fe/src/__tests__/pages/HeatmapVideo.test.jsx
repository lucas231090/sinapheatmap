import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter, useParams } from "react-router-dom";
import HeatmapVideo from "@/pages/HeatmapVideo/HeatmapVideo";
import useHeatmapVideoLogic from "@/hooks/useHeatmapVideoLogic";
import { Player } from "@remotion/player";

jest.mock("@/../config", () => ({
  __esModule: true,
  default: {
    API_BASE_URL: "http://mock-api.com",
  },
}));

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
}));

// Mock hooks
jest.mock("@/hooks/useHeatmapVideoLogic");

// Mock Remotion Player
jest.mock("@remotion/player", () => ({
  Player: jest.fn((props) => (
    <div data-testid="remotion-player">
      Mock Remotion Player
      <button data-testid="player-play-button" onClick={props.onPlay}>
        Play
      </button>
      <button data-testid="player-pause-button" onClick={props.onPause}>
        Pause
      </button>
      {/* Simulate inputProps being used */}
      <div>{props.inputProps.heatmapData && "Has heatmap data"}</div>
      <div>{props.inputProps.img && "Has image"}</div>
    </div>
  )),
}));

// Mock VideoControls (optional, but good for isolation)
jest.mock("@/components/Heatmap/VideoControls", () => {
  return jest.fn((props) => (
    <div data-testid="video-controls-mock">
      Mock Video Controls
      <button
        data-testid="controls-select-test"
        onClick={() => props.setSelectedTestIndex("1")}
      >
        Select Test
      </button>
      <button data-testid="controls-start-video" onClick={props.onVideoStart}>
        Start Video
      </button>
      <input
        type="range"
        data-testid="controls-speed-selector"
        onChange={(e) => props.setPlaybackSpeed(parseFloat(e.target.value))}
      />
    </div>
  ));
});

describe("HeatmapVideo Page", () => {
  let mockUseHeatmapVideoLogic;

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: "test-video-id" });

    mockUseHeatmapVideoLogic = {
      playerRef: { current: null },
      isPlaying: false,
      setIsPlaying: jest.fn(),
      showPlayer: true,
      playbackSpeed: 1,
      setPlaybackSpeed: jest.fn(),
      playerKey: 0,
      fileName: "Test Video File",
      dataFile: [{ id: "1", name: "Test 1" }],
      img: "test-image.jpg",
      width: 1280,
      height: 720,
      totalFrames: 300,
      hasValidData: true,
      heatmapData: {
        coords: [{ x: 1, y: 1, value: 1 }],
        radiusScale: 1,
        canvasSize: { width: 1280, height: 720 },
      },
      isLoading: false,
      error: null,
      hasSingleTest: false,
      shouldShowSelector: true,
      currentTestIndex: "1",
      selectedTestIndex: "1",
      handleTestSelect: jest.fn(),
      handleVideoStart: jest.fn(),
    };
    useHeatmapVideoLogic.mockReturnValue(mockUseHeatmapVideoLogic);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <HeatmapVideo />
      </BrowserRouter>
    );

  test("renders loading state", () => {
    useHeatmapVideoLogic.mockReturnValue({
      ...mockUseHeatmapVideoLogic,
      isLoading: true,
    });
    renderComponent();
    expect(
      screen.getByText(/carregando dados do vídeo.../i)
    ).toBeInTheDocument();
  });

  test("renders error state", () => {
    useHeatmapVideoLogic.mockReturnValue({
      ...mockUseHeatmapVideoLogic,
      error: "Failed to load",
    });
    renderComponent();
    expect(screen.getByText(/erro: failed to load/i)).toBeInTheDocument();
  });

  test("renders page title and VideoControls when not loading and no error", () => {
    renderComponent();
    // The text is split by strong tag, so we need to use a more flexible approach
    expect(screen.getByText("Eyetracking Heatmap:")).toBeInTheDocument();
    expect(screen.getByText("Test Video File")).toBeInTheDocument();
    expect(screen.getByTestId("video-controls-mock")).toBeInTheDocument();
  });

  test("renders placeholder when showPlayer is false or hasValidData is false", () => {
    useHeatmapVideoLogic.mockReturnValue({
      ...mockUseHeatmapVideoLogic,
      showPlayer: false,
      hasSingleTest: false,
      currentTestIndex: null,
    });
    renderComponent();
    expect(
      screen.getByText(/selecione um teste para começar/i)
    ).toBeInTheDocument();

    useHeatmapVideoLogic.mockReturnValue({
      ...mockUseHeatmapVideoLogic,
      showPlayer: true,
      hasValidData: false,
      currentTestIndex: "1",
    });
    render(
      <BrowserRouter>
        <HeatmapVideo />
      </BrowserRouter>
    ); // Re-render
    expect(
      screen.getByText(/carregando dados do heatmap.../i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nenhum dado disponível para este teste./i)
    ).toBeInTheDocument();
  });

  test("renders Remotion Player when showPlayer and hasValidData are true", () => {
    renderComponent();
    expect(screen.getByTestId("remotion-player")).toBeInTheDocument();
    expect(Player).toHaveBeenCalledWith(
      expect.objectContaining({
        component: expect.any(Function), // HeatmapComposition
        durationInFrames: mockUseHeatmapVideoLogic.totalFrames,
        compositionWidth: mockUseHeatmapVideoLogic.width,
        compositionHeight: mockUseHeatmapVideoLogic.height,
        inputProps: {
          heatmapData: mockUseHeatmapVideoLogic.heatmapData,
          img: mockUseHeatmapVideoLogic.img,
        },
        playbackRate: mockUseHeatmapVideoLogic.playbackSpeed,
        fps: 30,
        controls: true,
        autoPlay: false,
        clickToPlay: true,
        doubleClickToFullscreen: true,
        onPlay: expect.any(Function),
        onPause: expect.any(Function),
        ref: expect.any(Object),
        style: expect.objectContaining({
          width: mockUseHeatmapVideoLogic.width,
          height: mockUseHeatmapVideoLogic.height,
        }),
      }),
      undefined
    );
  });

  test("calls setIsPlaying when Player onPlay/onPause are triggered", () => {
    renderComponent();
    const playerInstance = Player.mock.calls[0][0]; // Get props of the Player mock

    playerInstance.onPlay();
    expect(mockUseHeatmapVideoLogic.setIsPlaying).toHaveBeenCalledWith(true);

    playerInstance.onPause();
    expect(mockUseHeatmapVideoLogic.setIsPlaying).toHaveBeenCalledWith(false);
  });

  test("VideoControls receives correct props and callbacks function as expected", () => {
    renderComponent();
    // Check if VideoControls mock was called with the right props
    const VideoControlsMock = jest.requireMock(
      "@/components/Heatmap/VideoControls"
    );
    expect(VideoControlsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        playerRef: mockUseHeatmapVideoLogic.playerRef,
        isPlaying: mockUseHeatmapVideoLogic.isPlaying,
        setIsPlaying: mockUseHeatmapVideoLogic.setIsPlaying,
        duration: mockUseHeatmapVideoLogic.totalFrames,
        dataFile: mockUseHeatmapVideoLogic.dataFile,
        selectedTestIndex: mockUseHeatmapVideoLogic.selectedTestIndex,
        setSelectedTestIndex: mockUseHeatmapVideoLogic.handleTestSelect,
        onVideoStart: mockUseHeatmapVideoLogic.handleVideoStart,
        playbackSpeed: mockUseHeatmapVideoLogic.playbackSpeed,
        setPlaybackSpeed: mockUseHeatmapVideoLogic.setPlaybackSpeed,
        hasSingleTest: mockUseHeatmapVideoLogic.hasSingleTest,
        shouldShowSelector: mockUseHeatmapVideoLogic.shouldShowSelector,
        currentTestIndex: mockUseHeatmapVideoLogic.currentTestIndex,
      }),
      undefined
    );

    // Simulate interactions with mocked VideoControls
    fireEvent.click(screen.getByTestId("controls-select-test"));
    expect(mockUseHeatmapVideoLogic.handleTestSelect).toHaveBeenCalledWith("1");

    fireEvent.click(screen.getByTestId("controls-start-video"));
    expect(mockUseHeatmapVideoLogic.handleVideoStart).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("controls-speed-selector"), {
      target: { value: "1.5" },
    });
    expect(mockUseHeatmapVideoLogic.setPlaybackSpeed).toHaveBeenCalledWith(1.5);
  });
});
