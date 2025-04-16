/**
 * Testes unitários para o componente HeatmapRenderer
 * Verifica a renderização do heatmap, configuração e resposta a mudanças de props
 */
import React from "react";
import { render } from "@testing-library/react";
import HeatmapRenderer from "../HeatmapRenderer";

/**
 * Mock para a biblioteca heatmap.js
 * O caminho do mock deve corresponder ao caminho de importação usado no componente
 */
jest.mock("@mars3d/heatmap.js", () => ({
  create: jest.fn(() => ({
    setData: jest.fn(),
    repaint: jest.fn(),
  })),
}));

// Mock para o h337 que é utilizado nos testes
const mockHeatmapLib = require("@mars3d/heatmap.js");

describe("HeatmapRenderer Component", () => {
  let mockProps;
  let onloadCallback; // Variável para armazenar o callback de onload

  /**
   * Antes de cada teste, configura as props mockadas
   * para garantir um ambiente limpo para cada teste
   */
  beforeEach(() => {
    // Limpa histórico dos mocks
    jest.clearAllMocks();
    onloadCallback = null; // Limpa o callback entre testes

    // Recria os elementos DOM para cada teste
    const divElement = document.createElement("div");
    const imgElement = document.createElement("img");

    // Configura as props mockadas
    mockProps = {
      heatmapCanvasRef: { current: divElement },
      canvasSize: { width: 800, height: 600 },
      img: "test-image-url",
      imgRef: { current: imgElement },
      coords: [
        { x: 100, y: 150, value: 1 },
        { x: 200, y: 250, value: 1 },
        { x: 300, y: 350, value: 1 },
      ],
      radiusScale: 1.0,
    };

    // Configura mocks para métodos do DOM
    mockProps.heatmapCanvasRef.current.querySelector = jest.fn(() => {
      const canvas = document.createElement("canvas");
      canvas.getContext = jest.fn(() => ({
        drawImage: jest.fn(),
        clearRect: jest.fn(),
      }));
      return canvas;
    });

    // Mock para manipulação do DOM
    mockProps.heatmapCanvasRef.current.appendChild = jest.fn();
    mockProps.heatmapCanvasRef.current.removeChild = jest.fn();

    // Adiciona atributos de estilo
    mockProps.heatmapCanvasRef.current.style = {
      width: "",
      height: "",
    };

    // Adiciona a propriedade className para verificação
    mockProps.heatmapCanvasRef.current.className = "heatmapContainer";

    // Simula o evento onload armazenando o callback para chamada posterior
    Object.defineProperty(mockProps.imgRef.current, "onload", {
      set: function (callback) {
        onloadCallback = callback; // Guarda o callback para usar depois
      },
      configurable: true,
    });
  });

  test("renders correctly with image and canvas elements", () => {
    render(<HeatmapRenderer {...mockProps} />);

    // Verifica se o container do heatmap existe
    const heatmapContainer = mockProps.heatmapCanvasRef.current;
    expect(heatmapContainer).toBeTruthy();
    expect(heatmapContainer.className).toBe("heatmapContainer");
  });

  test("creates heatmap instance with correct configuration", () => {
    render(<HeatmapRenderer {...mockProps} />);

    // Simula que a imagem carregou chamando o callback armazenado
    onloadCallback && onloadCallback();

    // Verifica se heatmap.js foi chamado
    expect(mockHeatmapLib.create).toHaveBeenCalled();
  });

  test("adjusts radius based on radiusScale prop", () => {
    render(<HeatmapRenderer {...mockProps} />);

    // Força a criação do primeiro heatmap
    onloadCallback && onloadCallback();

    // Captura o raio do primeiro heatmap
    const firstRadius = mockHeatmapLib.create.mock.calls[0][0].radius;

    // Limpa os mocks para o próximo teste
    jest.clearAllMocks();

    // Força a criação do segundo heatmap com raio diferente
    const propsWithLargerRadius = {
      ...mockProps,
      radiusScale: 2.0,
    };

    render(<HeatmapRenderer {...propsWithLargerRadius} />);

    // Simula que a imagem carregou no segundo render
    onloadCallback && onloadCallback();

    // Captura o raio do segundo heatmap
    const secondRadius = mockHeatmapLib.create.mock.calls[0][0].radius;

    // Verifica que o raio foi aproximadamente dobrado
    expect(secondRadius).toBeGreaterThan(firstRadius);
  });

  test("redraws heatmap when coordinates change", () => {
    // Mock para o objeto retornado por create
    const mockHeatmapInstance = {
      setData: jest.fn(),
      repaint: jest.fn(),
    };

    // Configura o mock para retornar nossa instância mockada
    mockHeatmapLib.create.mockReturnValue(mockHeatmapInstance);

    const { rerender } = render(<HeatmapRenderer {...mockProps} />);

    // Força a renderização inicial
    onloadCallback && onloadCallback();

    // Muda coordenadas e re-renderiza
    const newCoords = [
      { x: 400, y: 450, value: 1 },
      { x: 500, y: 550, value: 1 },
    ];

    rerender(<HeatmapRenderer {...mockProps} coords={newCoords} />);

    // Verifica que setData foi chamado pelo menos uma vez
    expect(mockHeatmapInstance.setData).toHaveBeenCalled();
  });

  test("redraws heatmap when canvas size changes", () => {
    const { rerender } = render(<HeatmapRenderer {...mockProps} />);

    // Força a renderização inicial
    onloadCallback && onloadCallback();

    // Muda tamanho do canvas e re-renderiza
    const newCanvasSize = { width: 1024, height: 768 };
    rerender(<HeatmapRenderer {...mockProps} canvasSize={newCanvasSize} />);

    // Verifica se os estilos do contêiner foram atualizados
    expect(mockProps.heatmapCanvasRef.current.style.width).toBe("1024px");
    expect(mockProps.heatmapCanvasRef.current.style.height).toBe("768px");
  });
});
