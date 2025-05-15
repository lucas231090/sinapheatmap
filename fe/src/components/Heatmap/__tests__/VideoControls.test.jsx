/**
 * Testes unitários para o componente VideoControls
 * Verifica a renderização e interatividade dos controles de vídeo de heatmap
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import VideoControls from "../VideoControls";

// Mock para o componente TestSelector
jest.mock("../../Heatmap/TestSelector", () => {
  return jest.fn((props) => (
    <div data-testid="test-selector-mock">
      <select
        data-testid="test-selector"
        value={props.selectedTestIndex}
        onChange={(e) => props.setSelectedTestIndex(e.target.value)}
      >
        <option value="">Selecione</option>
        <option value="all">Todos</option>
        <option value="0">Test 1</option>
      </select>
    </div>
  ));
});

// Mock para ícones do Material UI
// Em vez de fazer mock diretamente dos ícones importados,
// vamos criar um mock completo para todo o pacote Material UI icons
jest.mock(
  "@mui/icons-material/SpeedIcon",
  () => ({
    __esModule: true,
    default: () => <div data-testid="mock-speed-icon" />,
  }),
  { virtual: true }
);

jest.mock(
  "@mui/icons-material/PlayArrow",
  () => ({
    __esModule: true,
    default: () => <div data-testid="mock-play-arrow-icon" />,
  }),
  { virtual: true }
);

describe("VideoControls Component", () => {
  // Propriedades comuns para os testes
  const defaultProps = {
    playerRef: { current: { pause: jest.fn(), play: jest.fn() } },
    isPlaying: false,
    setIsPlaying: jest.fn(),
    duration: 300,
    dataFile: { jsonData: [{ test: "data1" }, { test: "data2" }] },
    selectedTestIndex: "",
    setSelectedTestIndex: jest.fn(),
    onVideoStart: jest.fn(),
    playbackSpeed: 1,
    setPlaybackSpeed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Testa se o componente renderiza corretamente
  test("renders correctly with all controls", () => {
    render(<VideoControls {...defaultProps} />);

    // Verifica se o seletor de testes está presente
    expect(screen.getByTestId("test-selector-mock")).toBeInTheDocument();

    // Verifica se o controle de velocidade está presente
    expect(screen.getByText(/Velocidade:/i)).toBeInTheDocument();

    // Verifica se há selects na página - usando getAllByRole para evitar erros com múltiplos elementos
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBeGreaterThan(0);

    // Verifica as opções de velocidade
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(1);
    expect(
      options.find((o) => o.textContent.includes("1x"))
    ).toBeInTheDocument();
  });

  // Testa se o seletor de velocidade funciona
  test("changes playback speed when selected", () => {
    render(<VideoControls {...defaultProps} />);

    // Seleciona a velocidade 2x - pegando o segundo select (índice 1) que é o de velocidade
    const speedSelectors = screen.getAllByRole("combobox");
    const speedSelector = speedSelectors[speedSelectors.length - 1]; // Último select é o de velocidade
    fireEvent.change(speedSelector, { target: { value: "2" } });

    // Verifica se a função setPlaybackSpeed foi chamada com o valor correto
    expect(defaultProps.setPlaybackSpeed).toHaveBeenCalledWith(2);
  });

  // Testa se a pausa e play são aplicados quando a velocidade muda
  test("pauses and plays when speed changes while playing", () => {
    // Renderiza com isPlaying=true
    render(<VideoControls {...defaultProps} isPlaying={true} />);

    // Muda a velocidade - pegando o segundo select (índice 1) que é o de velocidade
    const speedSelectors = screen.getAllByRole("combobox");
    const speedSelector = speedSelectors[speedSelectors.length - 1]; // Último select é o de velocidade
    fireEvent.change(speedSelector, { target: { value: "0.5" } });

    // Verifica se o player foi pausado
    expect(defaultProps.playerRef.current.pause).toHaveBeenCalled();

    // Avança o timer para verificar se o play é chamado após o timeout
    act(() => {
      jest.advanceTimersByTime(51);
    });

    // Verifica se o player foi iniciado novamente
    expect(defaultProps.playerRef.current.play).toHaveBeenCalled();
  });

  // Testa se o vídeo inicia quando um teste é selecionado
  test("starts video when test is selected", () => {
    const { rerender } = render(<VideoControls {...defaultProps} />);

    // Verifica que onVideoStart não foi chamado ainda
    expect(defaultProps.onVideoStart).not.toHaveBeenCalled();

    // Simula a seleção de um teste (mudando a prop)
    rerender(<VideoControls {...defaultProps} selectedTestIndex="0" />);

    // Verifica que onVideoStart foi chamado
    expect(defaultProps.onVideoStart).toHaveBeenCalled();
  });

  // Testa o comportamento quando o teste já foi iniciado
  test("doesn't restart video if already started", () => {
    // Renderiza com um test já selecionado e hasStarted=true (internamente)
    const component = render(
      <VideoControls {...defaultProps} selectedTestIndex="0" />
    );

    // Limpa o mock para resetar as chamadas
    defaultProps.onVideoStart.mockClear();

    // Força uma nova renderização (que não deveria chamar onVideoStart novamente)
    component.rerender(
      <VideoControls {...defaultProps} selectedTestIndex="0" />
    );

    // Verifica que onVideoStart não foi chamado novamente
    expect(defaultProps.onVideoStart).not.toHaveBeenCalled();
  });
});
