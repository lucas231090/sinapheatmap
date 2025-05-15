/**
 * Testes unitários para o hook useHeatmap
 * Verifica o comportamento do hook que gerencia dados do heatmap
 */
import { renderHook, act } from '@testing-library/react';
import useHeatmap from '../useHeatmap';
import { getFileById, getFileMedia } from '../../services/fileService';
import { combineCoordinates, calculateResponsiveScale, downloadHeatMap } from '../../services/heatmapService';

// Mock dos serviços
jest.mock('../../services/fileService', () => ({
    getFileById: jest.fn(),
    getFileMedia: jest.fn()
}));

jest.mock('../../services/heatmapService', () => ({
    combineCoordinates: jest.fn(),
    calculateResponsiveScale: jest.fn(),
    downloadHeatMap: jest.fn()
}));

// Mock para config
jest.mock('../../../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

describe('useHeatmap hook', () => {
    // Configuração inicial
    const mockId = 'test-id';
    const canvasRef = { current: document.createElement('canvas') };
    const heatmapCanvasRef = {
        current: document.createElement('div')
    };
    const imgRef = { current: document.createElement('img') };

    // Adiciona um canvas ao heatmapCanvasRef
    heatmapCanvasRef.current.appendChild(document.createElement('canvas'));

    // Dados mockados para os testes
    const mockFileData = {
        _id: mockId,
        filename: 'Test File',
        mediaPath: '/uploads/media/test.jpg',
        jsonData: [{
            'Data-Hora': '2023-01-01',
            'Largura Tela': 1920,
            'Altura Tela': 1080,
            x: '100;200;300',
            y: '150;250;350'
        }]
    };

    // Coordenadas processadas mockadas
    const mockCoords = [
        { x: 100, y: 150, value: 50 },
        { x: 200, y: 250, value: 50 },
        { x: 300, y: 350, value: 50 }
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Configura retornos dos mocks
        getFileById.mockResolvedValue(mockFileData);
        getFileMedia.mockResolvedValue('blob:url');

        combineCoordinates.mockReturnValue([
            { x: 100, y: 150 },
            { x: 200, y: 250 },
            { x: 300, y: 350 }
        ]);

        calculateResponsiveScale.mockReturnValue(0.5);

        // Mock para document.querySelectorAll
        document.querySelectorAll = jest.fn().mockReturnValue([]);

        // Configura dimensões da janela
        Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should fetch and process data on mount', async () => {
        // Renderiza o hook
        const { result } = renderHook(() => useHeatmap(
            mockId,
            'all',
            canvasRef,
            heatmapCanvasRef,
            imgRef,
            true,
            true
        ));

        // Verifica estado inicial
        expect(result.current.fileName).toBeUndefined();
        expect(result.current.dataFile).toBeUndefined();
        expect(result.current.img).toBeNull();

        // Aguarda conclusão das operações assíncronas
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verifica se os serviços foram chamados
        expect(getFileById).toHaveBeenCalledWith(mockId);
        expect(getFileMedia).toHaveBeenCalled();

        // Verifica se os dados foram processados
        expect(result.current.fileName).toBe('Test File');
        expect(result.current.dataFile).toEqual(mockFileData);
        expect(result.current.jsonFile).toEqual(mockFileData.jsonData[0]);
        expect(result.current.img).toBe('blob:url');
    });

    test('should update heatmap when test selection changes', async () => {
        // Renderiza o hook
        const { result, rerender } = renderHook(
            (props) => useHeatmap(
                props.id,
                props.selectedTestIndex,
                canvasRef,
                heatmapCanvasRef,
                imgRef,
                true,
                true
            ),
            {
                initialProps: {
                    id: mockId,
                    selectedTestIndex: 'all'
                }
            }
        );

        // Aguarda o carregamento inicial
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Limpa as chamadas anteriores
        calculateResponsiveScale.mockClear();
        combineCoordinates.mockClear();

        // Muda o teste selecionado
        rerender({
            id: mockId,
            selectedTestIndex: '0'
        });

        // Aguarda processamento da mudança
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verifica se as funções foram chamadas novamente com os novos parâmetros
        expect(calculateResponsiveScale).toHaveBeenCalled();
        expect(combineCoordinates).toHaveBeenCalledWith(expect.anything(), '0');
    });

    test('should call downloadHeatMap service when downloadHeatMap is called', async () => {
        // Renderiza o hook
        const { result } = renderHook(() => useHeatmap(
            mockId,
            'all',
            canvasRef,
            heatmapCanvasRef,
            imgRef,
            true,
            true
        ));

        // Aguarda o carregamento inicial
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Chama a função de download
        act(() => {
            result.current.downloadHeatMap();
        });

        // Verifica se o serviço de download foi chamado com os parâmetros corretos
        expect(downloadHeatMap).toHaveBeenCalledWith({
            heatmapCanvasRef,
            canvasRef,
            imgRef,
            canvasSize: result.current.canvasSize,
            heatmapVisible: true,
            canvasVisible: true,
            fileName: 'Test File'
        });
    });

    test('should handle window resize events', async () => {
        // Renderiza o hook
        const { result } = renderHook(() => useHeatmap(
            mockId,
            'all',
            canvasRef,
            heatmapCanvasRef,
            imgRef,
            true,
            true
        ));

        // Aguarda o carregamento inicial
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Limpa as chamadas anteriores
        calculateResponsiveScale.mockClear();

        // Simula evento de resize
        act(() => {
            window.innerWidth = 1280;
            window.innerHeight = 720;
            window.dispatchEvent(new Event('resize'));
        });

        // Aguarda processamento do evento
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verifica se a escala foi recalculada
        expect(calculateResponsiveScale).toHaveBeenCalled();
    });
});
