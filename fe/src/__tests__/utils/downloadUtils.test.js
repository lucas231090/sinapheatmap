/**
 * Testes unitários para utilitários de download de arquivos
 * Verifica as funções de download de imagens e dados JSON
 */
import {
    downloadHeatMapImage,
    downloadJSON
} from '@/utils/downloadUtils';

describe('downloadUtils', () => {
    let mockLink;
    let mockCanvas;
    let mockContext;
    let createElementSpy;
    let querySelectorAllSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock do console para capturar errors
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock do link element
        mockLink = {
            href: '',
            download: '',
            click: jest.fn()
        };
        
        // Mock do canvas context
        mockContext = {
            drawImage: jest.fn(),
            clearRect: jest.fn()
        };
        
        // Mock do canvas element
        mockCanvas = {
            width: 0,
            height: 0,
            getContext: jest.fn(() => mockContext),
            toDataURL: jest.fn(() => 'data:image/png;base64,mock-data')
        };
        
        // Usar spies reais para interceptar as chamadas do document
        createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
            if (tagName === 'a') return mockLink;
            if (tagName === 'canvas') return mockCanvas;
            return {};
        });
        
        querySelectorAllSpy = jest.spyOn(document, 'querySelectorAll').mockImplementation((selector) => {
            if (selector === '.heatmap-canvas') {
                return [mockCanvas];
            }
            return [];
        });
        
        // Mock para document.body métodos
        jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

        global.URL = {
            createObjectURL: jest.fn(() => 'blob:url'),
            revokeObjectURL: jest.fn()
        };

        global.Blob = jest.fn(() => ({}));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /**
     * Testes para a função downloadHeatMapImage
     */
    describe('downloadHeatMapImage', () => {
        const getValidParams = () => ({
            heatmapCanvasRef: { current: mockCanvas },
            canvasRef: { current: mockCanvas },
            imgRef: { current: { src: 'mock-image-src' } },
            canvasSize: { width: 800, height: 600 },
            heatmapVisible: true,
            canvasVisible: true,
            fileName: 'test-heatmap'
        });

        test('downloads heatmap image successfully', () => {
            const params = getValidParams();
            
            // Debug: verificar se console.error foi chamado
            downloadHeatMapImage(params);

            // Verificar se querySelectorAll foi chamado corretamente
            expect(querySelectorAllSpy).toHaveBeenCalledWith('.heatmap-canvas');
            
            // O querySelectorAll deve retornar um array com o mockCanvas
            const result = querySelectorAllSpy('.heatmap-canvas');
            expect(result).toEqual([mockCanvas]);
            expect(result[0]).toBe(mockCanvas);

            // Se console.error foi chamado, a função retornou early
            expect(console.error).not.toHaveBeenCalledWith("Canvas do heatmap não encontrado");
            
            expect(createElementSpy).toHaveBeenCalledWith('canvas');
            expect(mockCanvas.width).toBe(800);
            expect(mockCanvas.height).toBe(600);
            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(mockLink.download).toBe('Heatmap-test-heatmap.png');
            expect(mockLink.click).toHaveBeenCalled();
        });

        test('uses default filename when not provided', () => {
            const params = getValidParams();
            delete params.fileName;
            
            downloadHeatMapImage(params);

            expect(mockLink.download).toBe('Heatmap-export.png');
        });

        test('handles missing references', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const params = getValidParams();
            params.heatmapCanvasRef = null;
            
            downloadHeatMapImage(params);

            expect(consoleSpy).toHaveBeenCalledWith(
                "Referências necessárias não encontradas para download"
            );
            expect(mockLink.click).not.toHaveBeenCalled();
        });
    });

    /**
     * Testes para a função downloadJSON
     */
    describe('downloadJSON', () => {
        test('downloads JSON data successfully', () => {
            const data = { test: 'data', values: [1, 2, 3] };
            const filename = 'test-data';
            
            downloadJSON(data, filename);

            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(mockLink.download).toBe('test-data.json');
            expect(mockLink.click).toHaveBeenCalled();
        });

        test('uses filename without extension', () => {
            const data = { test: 'data' };
            const filename = 'my-data';
            
            downloadJSON(data, filename);

            expect(mockLink.download).toBe('my-data.json');
        });

        test('handles null data', () => {
            downloadJSON(null, 'null');

            expect(mockLink.download).toBe('null.json');
            expect(mockLink.click).toHaveBeenCalled();
        });
    });
});
