/**
 * Testes unitários para o hook useHeatmapData
 * Verifica o comportamento do hook que gerencia dados do heatmap e processamento de imagens
 */
import { renderHook, act } from '@testing-library/react';
import useHeatmapData from '../useHeatmapData';
import { getFileById, getFileMedia } from '../../../../services/fileService';

/**
 * Mock dos serviços de arquivos
 * Substitui as funções reais por versões mockadas para controlar as respostas
 * durante os testes, evitando chamadas à API real
 */
jest.mock('../../../../services/fileService', () => ({
    getFileById: jest.fn(),
    getFileMedia: jest.fn()
}));

/**
 * Mock para o config module
 * Fornece uma versão estática da configuração que substitui import.meta.env
 * que não é suportado no ambiente de testes Jest
 */
jest.mock('../../../../../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

/**
 * Mock para a API URL.createObjectURL do navegador
 * Esta API converte blobs em URLs utilizáveis e precisa ser simulada no ambiente de testes
 */
global.URL.createObjectURL = jest.fn();

// Mock para console.log e console.warn para reduzir ruído nos testes
global.console.log = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

describe('useHeatmapData hook', () => {
    /**
     * Configuração inicial para os testes
     * Cria referências para os elementos DOM que o hook utiliza
     */
    const mockId = 'test-id';
    const canvasRef = { current: document.createElement('canvas') };
    const heatmapCanvasRef = {
        current: document.createElement('div')
    };
    const imgRef = { current: document.createElement('img') };

    // Adiciona um canvas dentro do container do heatmap para simular a estrutura do DOM
    heatmapCanvasRef.current.appendChild(document.createElement('canvas'));

    /**
     * Dados simulados que seriam retornados pela API
     * Contém informações de arquivo e dados de coordenadas em formato compatível com o hook
     */
    const mockFileData = {
        _id: mockId,
        filename: 'Test File',
        mediaPath: '/uploads/media/test.jpg',
        jsonData: [{
            'Data-Hora': '2023-01-01',
            'Largura Tela': 1920,
            'Altura Tela': 1080,
            x: '100;200;300',  // Coordenadas X separadas por ponto-e-vírgula
            y: '150;250;350'   // Coordenadas Y separadas por ponto-e-vírgula
        }]
    };

    /**
     * Configuração executada antes de cada teste
     * Reseta todos os mocks e configura o ambiente do DOM
     */
    beforeEach(() => {
        jest.clearAllMocks();  // Limpa histórico de chamadas de todos os mocks

        // Configura retorno padrão para os mocks dos serviços
        getFileById.mockResolvedValue(mockFileData);
        getFileMedia.mockResolvedValue('blob:url');
        global.URL.createObjectURL.mockReturnValue('blob:url');

        // Mock para seletores de elementos DOM
        document.querySelectorAll = jest.fn().mockReturnValue([]);

        // Mock avançado para document.createElement
        // Permite criar elementos canvas com um contexto 2d mockado
        const originalCreateElement = document.createElement.bind(document);
        document.createElement = jest.fn((tagName) => {
            const element = originalCreateElement(tagName);
            if (tagName === 'canvas') {
                // Adiciona um contexto 2d mock ao canvas para permitir operações de desenho
                element.getContext = jest.fn(() => ({
                    drawImage: jest.fn(),  // Mock para desenhar imagem no canvas
                    fillRect: jest.fn()    // Mock para desenhar retângulos (pontos) no canvas
                }));
            }
            return element;
        });

        // Configura dimensões do navegador para testes responsivos
        Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
    });

    /**
     * Limpeza após cada teste
     */
    afterEach(() => {
        jest.restoreAllMocks();  // Restaura implementações originais dos mocks
    });

    /**
     * Testa se o hook busca e processa os dados corretamente na montagem
     */
    test('should fetch and process data on mount', async () => {
        // Renderiza o hook com os parâmetros necessários
        const { result } = renderHook(() => useHeatmapData(
            mockId,         // ID do arquivo a ser carregado
            'all',          // tipo de visualização
            canvasRef,      // referência ao canvas principal
            heatmapCanvasRef, // referência ao container do heatmap
            imgRef,         // referência à imagem de fundo
            true,           // desenhar pontos
            true            // desenhar heatmap
        ));

        // Verifica o estado inicial antes da busca de dados
        expect(result.current.fileName).toBeUndefined();
        expect(result.current.dataFile).toBeUndefined();
        expect(result.current.jsonFile).toBeUndefined();
        expect(result.current.img).toBeNull();

        // Aguarda a conclusão das operações assíncronas (busca de dados)
        await act(async () => {
            // Pequena espera para garantir que as atualizações de estado sejam processadas
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verifica se as APIs foram chamadas corretamente
        expect(getFileById).toHaveBeenCalledWith(mockId);
        expect(getFileMedia).toHaveBeenCalled();

        // Verifica se os dados foram processados corretamente
        expect(result.current.fileName).toBe('Test File');
        expect(result.current.dataFile).toEqual(mockFileData);
        expect(result.current.jsonFile).toEqual(mockFileData.jsonData[0]);
        expect(result.current.img).toBe('blob:url');

        // Verifica se as coordenadas foram extraídas e processadas
        expect(result.current.coords).toHaveLength(3); // 3 pares de coordenadas x,y
        expect(result.current.canvasSize).toEqual(
            expect.objectContaining({
                width: expect.any(Number),
                height: expect.any(Number)
            })
        );
    });

    /**
     * Testa se o hook responde corretamente ao redimensionamento da janela
     */
    test('should handle window resize', async () => {
        // Renderiza o hook
        const { result } = renderHook(() => useHeatmapData(
            mockId,
            'all',
            canvasRef,
            heatmapCanvasRef,
            imgRef,
            true,
            true
        ));

        // Aguarda a conclusão do carregamento inicial
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Armazena o tamanho inicial do canvas para comparação
        const initialCanvasSize = { ...result.current.canvasSize };

        // Simula um evento de redimensionamento da janela com mudança MAIOR
        // para garantir que a escala mude significativamente
        await act(async () => {
            // Define novas dimensões com mudança mais drástica
            window.innerWidth = 800;  // Mudança maior que antes (de 1920 para 800)
            window.innerHeight = 600; // Mudança maior que antes (de 1080 para 600)
            
            // Dispara o evento de resize
            window.dispatchEvent(new Event('resize'));
            
            // Aguarda o processamento do evento
            await new Promise(resolve => setTimeout(resolve, 100)); // Aumentar tempo de espera
        });

        // Verifica se o tamanho do canvas foi recalculado
        expect(result.current.canvasSize).not.toEqual(initialCanvasSize);
    });

    /**
     * Testa se o hook lida corretamente com erros de API
     */
    test('should handle API errors gracefully', async () => {
        // Simula um erro na API
        getFileById.mockRejectedValue(new Error('API Error'));

        // Renderiza o hook
        const { result } = renderHook(() => useHeatmapData(
            mockId,
            'all',
            canvasRef,
            heatmapCanvasRef,
            imgRef,
            true,
            true
        ));

        // Aguarda a conclusão das operações assíncronas
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verifica se o hook não quebrou e manteve estados padrão
        expect(result.current.fileName).toBeUndefined();
        expect(result.current.dataFile).toBeUndefined();
        expect(result.current.coords).toEqual([]);
        expect(console.log).toHaveBeenCalledWith('API Error');
    });

    /**
     * Testa se o hook processa corretamente a seleção de testes específicos
     */
    test('should process specific test selection', async () => {
        // Dados com múltiplos testes
        const multiTestData = {
            _id: mockId,
            filename: 'Multiple Tests',
            mediaPath: '/uploads/media/test.jpg',
            jsonData: [
                {
                    'Data-Hora': '2023-01-01',
                    'Largura Tela': 1920,
                    'Altura Tela': 1080,
                    x: '100;200',
                    y: '150;250'
                },
                {
                    'Data-Hora': '2023-01-02',
                    'Largura Tela': 1920,
                    'Altura Tela': 1080,
                    x: '300;400',
                    y: '350;450'
                }
            ]
        };

        // Configura o mock para retornar múltiplos testes
        getFileById.mockResolvedValue(multiTestData);

        // Renderiza o hook com seleção específica do segundo teste
        const { result, rerender } = renderHook(
            ({ testIndex }) => useHeatmapData(
                mockId,
                testIndex,
                canvasRef,
                heatmapCanvasRef,
                imgRef,
                true,
                true
            ),
            { initialProps: { testIndex: 'all' } }
        );

        // Aguarda carregamento inicial
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Re-renderiza com seleção de teste específico
        rerender({ testIndex: '1' });

        // Aguarda processamento
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // As coordenadas devem corresponder apenas ao segundo teste (2 pontos)
        expect(result.current.coords).toHaveLength(2);
    });

    /**
     * Testa a função de download do heatmap
     */
    test('should prepare canvas for download', async () => {
        // Mock para o método toDataURL do canvas
        const mockToDataURL = jest.fn().mockReturnValue('data:image/png;base64,abc123');

        // Mock para o método click do link
        const mockClick = jest.fn();

        // Override para createElement para simular link de download
        const originalCreateElement = document.createElement.bind(document);
        document.createElement = jest.fn((tagName) => {
            const element = originalCreateElement(tagName);

            if (tagName === 'canvas') {
                element.getContext = jest.fn(() => ({
                    drawImage: jest.fn(),
                    fillRect: jest.fn()
                }));
                element.toDataURL = mockToDataURL;
            } else if (tagName === 'a') {
                element.click = mockClick;
            }

            return element;
        });

        // Renderiza o hook
        const { result } = renderHook(() => useHeatmapData(
            mockId,
            'all',
            canvasRef,
            heatmapCanvasRef,
            imgRef,
            true,
            true
        ));

        // Aguarda carregamento
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Executa função de download
        act(() => {
            result.current.downloadHeatMap();
        });

        // Verifica se o link foi criado e clicado
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(mockToDataURL).toHaveBeenCalledWith('image/png');
        expect(mockClick).toHaveBeenCalled();
    });
});