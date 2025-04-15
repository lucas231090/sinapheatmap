/**
 * Testes de integração para o componente HeatmapStatic
 * Verifica a interação entre os subcomponentes e o comportamento geral da página
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter, useParams } from "react-router-dom";
import HeatmapStatic from "../HeatmapStatic";
import useHeatmapData from "../hooks/useHeatmapData";

/**
 * Mock do arquivo de configuração
 * Substitui import.meta.env que não é suportado no Jest
 */
jest.mock("../../../../config", () => ({
  default: {
    API_BASE_URL: "http://api.example.com",
  },
}));

/**
 * Mock de react-router-dom para controlar parâmetros da URL
 */
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
}));

/**
 * Mock do hook useHeatmapData que busca e processa os dados
 */
jest.mock("../hooks/useHeatmapData");

/**
 * Mock dos componentes de zoom da biblioteca react-zoom-pan-pinch
 * Substitui a implementação real por versões simplificadas
 */
jest.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }) => (
    <div data-testid="transform-wrapper">{children}</div>
  ),
  TransformComponent: ({ children }) => (
    <div data-testid="transform-component">{children}</div>
  ),
  useControls: () => ({
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    resetTransform: jest.fn(),
  }),
}));

/**
 * Mock para o componente BubbleCanvas
 * Substitui o componente que utiliza API de canvas por uma div simples
 */
jest.mock("../components/BubbleCanvas", () => ({
  __esModule: true,
  default: ({ coords, canvasSize }) => (
    <div data-testid="bubble-canvas">
      Bubble Canvas (Mocked)
      <div data-testid="coords-count">{coords?.length || 0}</div>
    </div>
  ),
}));

/**
 * Mock para o componente HeatmapRenderer
 * Substitui o componente que utiliza canvas e biblioteca de heatmap
 */
jest.mock("../components/HeatmapRenderer", () => {
  // Mantenha uma referência ao elemento renderizado para poder acessá-lo nos testes
  let heatmapElement;
  const mockSetHeatmapVisibility = jest.fn(); // Definição movida para dentro do escopo do mock

  return {
    __esModule: true,
    default: ({ coords, canvasSize }) => {
      // Cria e armazena o elemento renderizado para uso posterior
      heatmapElement = (
        <div
          data-testid="heatmap-renderer"
          className="heatmapContainer"
          style={{ visibility: "visible" }}
        >
          Heatmap Renderer (Mocked)
          <div data-testid="heatmap-coords-count">{coords?.length || 0}</div>
        </div>
      );
      return heatmapElement;
    },
    // Expõe o elemento e a função de mudança de visibilidade para os testes
    getMockElement: () => heatmapElement,
    setHeatmapVisibility: mockSetHeatmapVisibility,
  };
});

describe("HeatmapStatic Integration", () => {
  /**
   * Dados mockados para o teste
   */
  const mockId = "test-id";
  const mockHeatmapData = {
    fileName: "Test File",
    dataFile: {
      _id: mockId,
      jsonData: [{ test: "data1" }, { test: "data2" }],
    },
    jsonFile: { test: "data" },
    img: "test-image-url",
    imgRef: { current: {} },
    coords: [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ],
    radiusScale: 1.0,
    canvasSize: { width: 800, height: 600 },
    done: true,
    windowSize: { width: 1920, height: 1080 },
    downloadHeatMap: jest.fn(),
  };

  // Mock de contêiner global para simular a visibilidade do heatmap
  let mockHeatmapContainer = {
    style: {
      visibility: "visible",
    },
  };

  /**
   * Configuração antes de cada teste
   */
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: mockId });
    useHeatmapData.mockReturnValue(mockHeatmapData);

    // Reseta o estado do container
    mockHeatmapContainer.style.visibility = "visible";

    // Mock do querySelector para manipular estilos de elementos
    document.querySelector = jest.fn().mockImplementation((selector) => {
      if (selector === ".heatmapContainer") {
        return mockHeatmapContainer;
      }
      return null;
    });
  });

  test("toggles heatmap visibility when button is clicked", () => {
    render(
      <BrowserRouter>
        <HeatmapStatic />
      </BrowserRouter>
    );

    // Encontra o botão de alternar visualização
    const toggleHeatmapButton = screen.getByText(/Hide Heatmap/i);
    expect(toggleHeatmapButton).toBeInTheDocument();

    // Simula a execução do setHeatmapCanvasVisible no HeatmapStatic
    act(() => {
      // Clica no botão para esconder o heatmap
      fireEvent.click(toggleHeatmapButton);

      // Simula manualmente a mudança de visibilidade
      mockHeatmapContainer.style.visibility = "hidden";
    });

    // Agora o botão deve mostrar "Show Heatmap"
    expect(toggleHeatmapButton).toHaveTextContent(/Show Heatmap/i);

    act(() => {
      // Clica novamente para mostrar o heatmap
      fireEvent.click(toggleHeatmapButton);

      // Simula manualmente a mudança de visibilidade de volta
      mockHeatmapContainer.style.visibility = "visible";
    });

    // Botão deve voltar ao estado original
    expect(toggleHeatmapButton).toHaveTextContent(/Hide Heatmap/i);
  });

  test("changes test selection and updates display", () => {
    render(
      <BrowserRouter>
        <HeatmapStatic />
      </BrowserRouter>
    );

    // Verifica se o seletor de testes é renderizado
    const testSelector = screen.getByRole("combobox");
    expect(testSelector).toBeInTheDocument();

    // Valor inicial deve ser "all"
    expect(testSelector.value).toBe("all");

    // Simula a seleção do primeiro teste
    fireEvent.change(testSelector, { target: { value: "0" } });

    // Verifica se o valor foi atualizado
    expect(testSelector.value).toBe("0");
  });

  test("renders correct components with data", () => {
    render(
      <BrowserRouter>
        <HeatmapStatic />
      </BrowserRouter>
    );

    // Verifica se componentes principais estão renderizados
    expect(screen.getByTestId("transform-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("transform-component")).toBeInTheDocument();
    expect(screen.getByTestId("heatmap-renderer")).toBeInTheDocument();

    // Verifica se o número de coordenadas está correto
    const coordsCount = screen.getByTestId("heatmap-coords-count");
    expect(coordsCount.textContent).toBe("2"); // 2 pontos nos dados mockados
  });
});
