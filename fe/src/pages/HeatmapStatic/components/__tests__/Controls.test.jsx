/**
 * Testes unitários para o componente Controls
 * Este arquivo testa o comportamento e a renderização dos controles de interface
 * que manipulam o heatmap, canvas, zoom e seleção de testes
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Controls from "../Controls";

/**
 * Criação de mockZoomControls no escopo global
 * Essas funções simuladas (mock) serão verificadas nos testes para
 * garantir que os botões de zoom chamam as funções corretas
 */
const mockZoomControls = {
  zoomIn: jest.fn(), // Simula função de aumentar zoom
  zoomOut: jest.fn(), // Simula função de diminuir zoom
  resetTransform: jest.fn(), // Simula função de resetar zoom/posição
};

/**
 * Mock completo da biblioteca react-zoom-pan-pinch
 * Substitui o hook useControls por uma função que retorna nosso objeto mockado
 * Isso permite verificar se as funções de controle são chamadas corretamente
 */
jest.mock("react-zoom-pan-pinch", () => ({
  useControls: jest.fn(() => mockZoomControls),
}));

/**
 * Mock do componente TestSelector
 * Em vez de usar o componente real, criamos uma versão simplificada
 * que aceita as mesmas props e simula o comportamento básico
 *
 * O componente só é renderizado quando há mais de um teste nos dados
 * e inclui um data-testid para facilitar a seleção nos testes
 */
jest.mock(
  "../TestSelector",
  () =>
    ({ dataFile, selectedTestIndex, setSelectedTestIndex }) =>
      dataFile && dataFile.jsonData && dataFile.jsonData.length > 1 ? (
        <div data-testid="test-selector">
          <select
            value={selectedTestIndex}
            onChange={(e) => setSelectedTestIndex(e.target.value)}
          >
            <option value="all">All Tests</option>
            <option value="0">Test 1</option>
          </select>
        </div>
      ) : null
);

describe("Controls Component", () => {
  /**
   * Definição de props mockadas para o componente
   * Estas props simulam as props reais que o componente receberia do componente pai
   * Incluem referências, estados, callbacks e dados para renderização
   */
  const mockProps = {
    transformComponentRef: { current: {} }, // Referência para componente de transformação (zoom/pan)
    heatmapCanvasVisible: true, // Estado inicial: heatmap visível
    setHeatmapCanvasVisible: jest.fn(), // Callback para alterar visibilidade do heatmap
    canvasVisible: false, // Estado inicial: canvas de bolhas oculto
    setCanvasVisible: jest.fn(), // Callback para alterar visibilidade do canvas
    downloadHeatMap: jest.fn(), // Callback para download do heatmap
    dataFile: { _id: "123", jsonData: [{ test: "data1" }, { test: "data2" }] }, // Dados com 2 testes
    selectedTestIndex: "all", // Índice de teste selecionado (inicialmente "all")
    setSelectedTestIndex: jest.fn(), // Callback para alterar índice selecionado
  };

  /**
   * Antes de cada teste, limpa o histórico de todos os mocks
   * Garante que cada teste comece com um estado limpo, sem influência de testes anteriores
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Teste de renderização dos controles
   * Verifica se todos os botões são renderizados corretamente com os textos esperados
   */
  test("renders control buttons correctly", () => {
    render(<Controls {...mockProps} />);

    // Verifica se todos os botões de controle existem com os textos corretos
    expect(screen.getByText("Hide Heatmap")).toBeInTheDocument();
    expect(screen.getByText("Show Bubbles")).toBeInTheDocument();
    expect(screen.getByText("Zoom In")).toBeInTheDocument();
    expect(screen.getByText("Zoom Out")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
    expect(screen.getByText("Download")).toBeInTheDocument();

    // Verifica que o TestSelector é renderizado (já que temos múltiplos testes)
    expect(screen.getByTestId("test-selector")).toBeInTheDocument();
  });

  /**
   * Teste do botão toggle de heatmap
   * Verifica se o botão alterna entre mostrar e esconder o heatmap
   * e se chama o callback apropriado com o valor correto
   */
  test("toggles heatmap visibility", () => {
    render(<Controls {...mockProps} />);

    // Inicialmente heatmapCanvasVisible é true, então o botão mostra "Hide Heatmap"
    const heatmapToggleButton = screen.getByText("Hide Heatmap");

    // Simula clique para esconder o heatmap
    fireEvent.click(heatmapToggleButton);
    // Verifica se o callback foi chamado com o valor correto (false)
    expect(mockProps.setHeatmapCanvasVisible).toHaveBeenCalledWith(false);

    // Renderiza novamente com props atualizadas (heatmap agora oculto)
    mockProps.setHeatmapCanvasVisible.mockClear();
    render(<Controls {...mockProps} heatmapCanvasVisible={false} />);

    // Agora o botão deve mostrar "Show Heatmap"
    const updatedHeatmapToggleButton = screen.getByText("Show Heatmap");

    // Simula clique para mostrar o heatmap novamente
    fireEvent.click(updatedHeatmapToggleButton);
    // Verifica se o callback foi chamado com o novo valor (true)
    expect(mockProps.setHeatmapCanvasVisible).toHaveBeenCalledWith(true);
  });

  /**
   * Teste do botão toggle de bolhas (canvas)
   * Verifica se o botão alterna entre mostrar e esconder as bolhas
   * e se chama o callback apropriado com o valor correto
   */
  test("toggles bubble canvas visibility", () => {
    render(<Controls {...mockProps} />);

    // Inicialmente canvasVisible é false, então o botão mostra "Show Bubbles"
    const canvasToggleButton = screen.getByText("Show Bubbles");

    // Simula clique para mostrar as bolhas
    fireEvent.click(canvasToggleButton);
    // Verifica se o callback foi chamado com o valor correto (true)
    expect(mockProps.setCanvasVisible).toHaveBeenCalledWith(true);

    // Renderiza novamente com props atualizadas (canvas agora visível)
    mockProps.setCanvasVisible.mockClear();
    render(<Controls {...mockProps} canvasVisible={true} />);

    // Agora o botão deve mostrar "Hide Bubbles"
    const updatedCanvasToggleButton = screen.getByText("Hide Bubbles");

    // Simula clique para esconder as bolhas novamente
    fireEvent.click(updatedCanvasToggleButton);
    // Verifica se o callback foi chamado com o novo valor (false)
    expect(mockProps.setCanvasVisible).toHaveBeenCalledWith(false);
  });

  /**
   * Teste dos botões de controle de zoom
   * Verifica se cada botão de zoom chama a função correta de zoom
   * do hook useControls da biblioteca react-zoom-pan-pinch
   */
  test("calls zoom controls", () => {
    render(<Controls {...mockProps} />);

    // Seleciona os botões de controle de zoom pelo texto
    const zoomInButton = screen.getByText("Zoom In");
    const zoomOutButton = screen.getByText("Zoom Out");
    const resetButton = screen.getByText("Reset");

    // Simula clique no botão de zoom in
    fireEvent.click(zoomInButton);
    // Verifica se a função zoomIn do mock foi chamada
    expect(mockZoomControls.zoomIn).toHaveBeenCalled();

    // Simula clique no botão de zoom out
    fireEvent.click(zoomOutButton);
    // Verifica se a função zoomOut do mock foi chamada
    expect(mockZoomControls.zoomOut).toHaveBeenCalled();

    // Simula clique no botão de reset
    fireEvent.click(resetButton);
    // Verifica se a função resetTransform do mock foi chamada
    expect(mockZoomControls.resetTransform).toHaveBeenCalled();
  });

  /**
   * Teste do botão de download
   * Verifica se o botão de download chama a função correta quando clicado
   */
  test("calls downloadHeatMap when download button is clicked", () => {
    render(<Controls {...mockProps} />);

    // Seleciona o botão de download pelo texto
    const downloadButton = screen.getByText("Download");
    // Simula clique no botão
    fireEvent.click(downloadButton);

    // Verifica se a função de download foi chamada
    expect(mockProps.downloadHeatMap).toHaveBeenCalled();
  });

  /**
   * Teste da renderização condicional do TestSelector
   * Verifica que o TestSelector não é renderizado quando há apenas um teste
   */
  test("does not render TestSelector when dataFile has only one test", () => {
    // Cria uma versão modificada das props com apenas um teste
    const propsWithSingleTest = {
      ...mockProps,
      dataFile: { _id: "123", jsonData: [{ test: "data1" }] },
    };

    render(<Controls {...propsWithSingleTest} />);

    // Verifica que o TestSelector não está no documento
    // Usa queryByTestId em vez de getByTestId porque esperamos que o elemento não exista
    expect(screen.queryByTestId("test-selector")).not.toBeInTheDocument();
  });
});
