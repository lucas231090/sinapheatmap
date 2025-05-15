/**
 * Testes unitários para o hook useHeatmapVideo
 * Verifica o comportamento do hook que gerencia dados do vídeo de heatmap
 */
import { renderHook, act } from '@testing-library/react';
import useHeatmapVideo from '../useHeatmapVideo';
import useHeatmap from '../useHeatmap';

// Mock do hook useHeatmap que este hook utiliza internamente
jest.mock('../useHeatmap', () => jest.fn());

describe('useHeatmapVideo hook', () => {
    // Dados simulados que seriam retornados pelo useHeatmap
    const mockHeatmapData = {
        fileName: 'Test Video',
        dataFile: { jsonData: [{ test: 'data' }] },
        img: 'test-image-url',
        coords: [
            { x: 100, y: 150, value: 50 },
            { x: 200, y: 250, value: 50 }
        ],
        canvasSize: { width: 1280, height: 720 },
        radiusScale: 0.5
    };

    // Configuração inicial para cada teste
    beforeEach(() => {
        jest.clearAllMocks();

        // Configura o mock do useHeatmap para retornar dados simulados
        useHeatmap.mockReturnValue(mockHeatmapData);

        // Mock para requestAnimationFrame
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());

        // Mock do playerRef.current
        global.playerRef = {
            current: {
                seekTo: jest.fn(),
                play: jest.fn()
            }
        };
    });

    // Limpeza após cada teste
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should initialize with correct default values', () => {
        // Renderiza o hook
        const { result } = renderHook(() => useHeatmapVideo('test-id', '0'));

        // Verifica valores iniciais
        expect(result.current.isPlaying).toBe(false);
        expect(result.current.showPlayer).toBe(false);
        expect(result.current.playbackSpeed).toBe(1);
        expect(result.current.playerKey).toBe(0);

        // Verifica se useHeatmap foi chamado com os parâmetros corretos
        expect(useHeatmap).toHaveBeenCalledWith(
            'test-id',
            '0',
            expect.any(Object), // canvasRef
            expect.any(Object), // heatmapCanvasRef
            expect.any(Object), // imgRef
            true,              // heatmapCanvasVisible
            false              // canvasVisible
        );

        // Verifica se os dados do heatmap foram processados corretamente
        expect(result.current.fileName).toBe('Test Video');
        expect(result.current.dataFile).toEqual({ jsonData: [{ test: 'data' }] });
        expect(result.current.img).toBe('test-image-url');
        expect(result.current.hasValidData).toBe(true);

        // Verifica cálculos derivados
        expect(result.current.width).toBe(1280);
        expect(result.current.height).toBe(720);
        expect(result.current.totalFrames).toBe(80); // 2 coordenadas * 10 frames + 60
        expect(result.current.heatmapData).toEqual({
            coords: mockHeatmapData.coords,
            radiusScale: 0.5,
            canvasSize: { width: 1280, height: 720 }
        });
    });

    test('handleTestSelect should update test index when changed', () => {
        // Renderiza o hook
        const { result } = renderHook(() => useHeatmapVideo('test-id', '0'));

        // Estado inicial
        expect(result.current.showPlayer).toBe(false);

        // Invoca a função com um novo índice
        let newIndex;
        act(() => {
            newIndex = result.current.handleTestSelect('1');
        });

        // Verifica se retornou o novo índice
        expect(newIndex).toBe('1');

        // Verifica se o estado foi atualizado
        expect(result.current.showPlayer).toBe(false);
        expect(result.current.isPlaying).toBe(false);
    });

    test('handleTestSelect should not update when index is the same', () => {
        // Renderiza o hook
        const { result } = renderHook(() => useHeatmapVideo('test-id', '0'));

        // Invoca a função com o mesmo índice
        let newIndex;
        act(() => {
            newIndex = result.current.handleTestSelect('0');
        });

        // Verifica se retornou o mesmo índice
        expect(newIndex).toBe('0');
    });

    test('handleVideoStart should set player to play from beginning', () => {
        // Renderiza o hook
        const { result } = renderHook(() => useHeatmapVideo('test-id', '0'));

        // Configura o playerRef para simular o player de vídeo
        const mockSeekTo = jest.fn();
        const mockPlay = jest.fn();

        result.current.playerRef.current = {
            seekTo: mockSeekTo,
            play: mockPlay
        };

        // Invoca a função handleVideoStart
        act(() => {
            result.current.handleVideoStart();
        });

        // Verifica se o player foi configurado corretamente
        expect(result.current.showPlayer).toBe(true);
        expect(mockSeekTo).toHaveBeenCalledWith(0);
        expect(mockPlay).toHaveBeenCalled();
        expect(result.current.isPlaying).toBe(true);
    });

    test('useEffect should remount player when selectedTestIndex changes', async () => {
        // Cria um jest.spyOn para setTimeout
        jest.useFakeTimers();

        // Renderiza o hook com props iniciais
        const { result, rerender } = renderHook(
            (props) => useHeatmapVideo(props.id, props.selectedTestIndex),
            {
                initialProps: {
                    id: 'test-id',
                    selectedTestIndex: ''
                }
            }
        );

        // Atualiza o índice selecionado
        rerender({
            id: 'test-id',
            selectedTestIndex: '1'
        });

        // Avança o timer para simular o timeout
        act(() => {
            jest.advanceTimersByTime(100);
        });

        // Verifica se o playerKey foi incrementado e o showPlayer foi atualizado
        expect(result.current.playerKey).toBe(1);
        expect(result.current.showPlayer).toBe(true);

        // Limpa os timers
        jest.useRealTimers();
    });
});
