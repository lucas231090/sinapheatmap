import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter, useParams } from "react-router-dom";
import HeatmapStatic from "@/pages/HeatmapStatic/HeatmapStatic";
import useHeatmapStaticLogic from "@/hooks/useHeatmapStaticLogic";

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
jest.mock("@/hooks/useHeatmapStaticLogic");

// Mock react-zoom-pan-pinch
jest.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }) => (
    <div data-testid="transform-wrapper">{children}</div>
  ),
  TransformComponent: ({ children }) => (
    <div data-testid="transform-component">{children}</div>
  ),
}));

// Mock components
jest.mock("@/components/HeatmapStatic/Controls", () => {
  return jest.fn((props) => (
    <div data-testid="controls-mock">
      Mock Controls
      <button
        data-testid="toggle-heatmap"
        onClick={() =>
          props.setHeatmapCanvasVisible(!props.heatmapCanvasVisible)
        }
      >
        Toggle Heatmap
      </button>
      <button
        data-testid="toggle-bubbles"
        onClick={() => props.setCanvasVisible(!props.canvasVisible)}
      >
        Toggle Bubbles
      </button>
      <button data-testid="download-button" onClick={props.downloadHeatMap}>
        Download
      </button>
      <select
        data-testid="test-selector"
        value={props.selectedTestIndex || ""}
        onChange={(e) => props.setSelectedTestIndex(e.target.value)}
      >
        <option value="">Select Test</option>
        <option value="1">Test 1</option>
        <option value="2">Test 2</option>
      </select>
    </div>
  ));
});

jest.mock("@/components/HeatmapStatic/HeatmapRenderer", () => {
  return jest.fn((props) => (
    <div data-testid="heatmap-renderer-mock">
      Mock Heatmap Renderer
      {props.coords && <span data-testid="coords-indicator">Has coords</span>}
    </div>
  ));
});

jest.mock("@/components/HeatmapStatic/BubbleCanvas", () => {
  return jest.fn((props) => (
    <div data-testid="bubble-canvas-mock">
      Mock Bubble Canvas
      {props.coords && (
        <span data-testid="bubble-coords-indicator">Has coords</span>
      )}
    </div>
  ));
});

describe("HeatmapStatic Page", () => {
  let mockUseHeatmapStaticLogic;

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: "test-heatmap-id" });

    mockUseHeatmapStaticLogic = {
      canvasRef: { current: null },
      heatmapCanvasRef: { current: null },
      imgRef: { current: null },
      canvasVisible: true,
      setCanvasVisible: jest.fn(),
      heatmapCanvasVisible: true,
      setHeatmapCanvasVisible: jest.fn(),
      fileName: "Test Heatmap File",
      dataFile: [{ id: "1", name: "Test 1" }],
      img: "test-image.jpg",
      coords: [{ x: 100, y: 150, value: 50 }],
      canvasSize: { width: 1280, height: 720 },
      radiusScale: 1,
      isLoading: false,
      error: null,
      selectedTestIndex: "1",
      setSelectedTestIndex: jest.fn(),
      downloadHeatMap: jest.fn(),
    };
    useHeatmapStaticLogic.mockReturnValue(mockUseHeatmapStaticLogic);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <HeatmapStatic />
      </BrowserRouter>
    );

  test("renders loading state", () => {
    useHeatmapStaticLogic.mockReturnValue({
      ...mockUseHeatmapStaticLogic,
      isLoading: true,
    });
    renderComponent();
    expect(screen.getByText(/carregando heatmap.../i)).toBeInTheDocument();
  });

  test("renders error state", () => {
    useHeatmapStaticLogic.mockReturnValue({
      ...mockUseHeatmapStaticLogic,
      error: "Failed to load heatmap",
    });
    renderComponent();
    expect(
      screen.getByText(/erro: failed to load heatmap/i)
    ).toBeInTheDocument();
  });

  test("renders page title and components when not loading and no error", () => {
    renderComponent();
    // The text is split by strong tag, so we need to use a more flexible approach
    expect(screen.getByText("Heatmap:")).toBeInTheDocument();
    expect(screen.getByText("Test Heatmap File")).toBeInTheDocument();
    expect(screen.getByTestId("transform-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("transform-component")).toBeInTheDocument();
    expect(screen.getByTestId("controls-mock")).toBeInTheDocument();
  });

  test("renders HeatmapRenderer when canvasSize is valid and heatmapCanvasVisible is true", () => {
    renderComponent();
    expect(screen.getByTestId("heatmap-renderer-mock")).toBeInTheDocument();
    expect(screen.getByTestId("coords-indicator")).toBeInTheDocument();
  });

  test("does not render HeatmapRenderer when canvasSize is invalid", () => {
    useHeatmapStaticLogic.mockReturnValue({
      ...mockUseHeatmapStaticLogic,
      canvasSize: { width: 0, height: 0 },
    });
    renderComponent();
    expect(
      screen.queryByTestId("heatmap-renderer-mock")
    ).not.toBeInTheDocument();
  });

  test("renders BubbleCanvas when canvasVisible is true", () => {
    renderComponent();
    expect(screen.getByTestId("bubble-canvas-mock")).toBeInTheDocument();
    expect(screen.getByTestId("bubble-coords-indicator")).toBeInTheDocument();
  });

  test("Controls component receives correct props and callbacks work", () => {
    renderComponent();
    const ControlsComponent = jest.requireMock(
      "@/components/HeatmapStatic/Controls"
    );

    // Check if Controls was called with correct props
    expect(ControlsComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        heatmapCanvasVisible: mockUseHeatmapStaticLogic.heatmapCanvasVisible,
        canvasVisible: mockUseHeatmapStaticLogic.canvasVisible,
        selectedTestIndex: mockUseHeatmapStaticLogic.selectedTestIndex,
        dataFile: mockUseHeatmapStaticLogic.dataFile,
      }),
      undefined
    );

    // Test interactions with Controls mock
    fireEvent.click(screen.getByTestId("toggle-heatmap"));
    expect(
      mockUseHeatmapStaticLogic.setHeatmapCanvasVisible
    ).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByTestId("toggle-bubbles"));
    expect(mockUseHeatmapStaticLogic.setCanvasVisible).toHaveBeenCalledWith(
      false
    );

    fireEvent.click(screen.getByTestId("download-button"));
    expect(mockUseHeatmapStaticLogic.downloadHeatMap).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("test-selector"), {
      target: { value: "2" },
    });
    expect(mockUseHeatmapStaticLogic.setSelectedTestIndex).toHaveBeenCalledWith(
      "2"
    );
  });

  test("HeatmapRenderer receives correct props", () => {
    renderComponent();
    const HeatmapRendererComponent = jest.requireMock(
      "@/components/HeatmapStatic/HeatmapRenderer"
    );

    expect(HeatmapRendererComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        heatmapCanvasRef: mockUseHeatmapStaticLogic.heatmapCanvasRef,
        canvasSize: mockUseHeatmapStaticLogic.canvasSize,
        img: mockUseHeatmapStaticLogic.img,
        imgRef: mockUseHeatmapStaticLogic.imgRef,
        coords: mockUseHeatmapStaticLogic.coords,
        radiusScale: mockUseHeatmapStaticLogic.radiusScale,
      }),
      undefined
    );
  });

  test("BubbleCanvas receives correct props", () => {
    renderComponent();
    const BubbleCanvasComponent = jest.requireMock(
      "@/components/HeatmapStatic/BubbleCanvas"
    );

    expect(BubbleCanvasComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        canvasRef: mockUseHeatmapStaticLogic.canvasRef,
        canvasSize: mockUseHeatmapStaticLogic.canvasSize,
        coords: mockUseHeatmapStaticLogic.coords,
      }),
      undefined
    );
  });

  test("visibility styles are applied correctly", () => {
    renderComponent();

    // HeatmapRenderer container should be visible when heatmapCanvasVisible is true
    const heatmapContainer = screen.getByTestId(
      "heatmap-renderer-mock"
    ).parentElement;
    expect(heatmapContainer).toHaveStyle("visibility: visible");

    // BubbleCanvas container should be visible when canvasVisible is true
    const bubbleContainer =
      screen.getByTestId("bubble-canvas-mock").parentElement;
    expect(bubbleContainer).toHaveStyle("visibility: visible");
  });

  test("components are hidden when visibility is false", () => {
    useHeatmapStaticLogic.mockReturnValue({
      ...mockUseHeatmapStaticLogic,
      heatmapCanvasVisible: false,
      canvasVisible: false,
    });
    renderComponent();

    // HeatmapRenderer container should be hidden when heatmapCanvasVisible is false
    const heatmapContainer = screen.getByTestId(
      "heatmap-renderer-mock"
    ).parentElement;
    expect(heatmapContainer).toHaveStyle("visibility: hidden");

    // BubbleCanvas container should be hidden when canvasVisible is false
    const bubbleContainer =
      screen.getByTestId("bubble-canvas-mock").parentElement;
    expect(bubbleContainer).toHaveStyle("visibility: hidden");
  });
});
