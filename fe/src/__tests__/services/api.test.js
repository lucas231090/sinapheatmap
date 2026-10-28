/**
 * Teste unitário para o módulo api
 * Verifica a configuração do axios e setup dos interceptors
 */
import axios from 'axios';

/**
 * Mock completo para o axios
 * Cria uma versão simulada do axios com todos os métodos necessários para teste
 */
vi.mock('axios', () => {

    // Cria objetos mock para os interceptors de requisição e resposta
    const mockInterceptors = {
        request: { use: vi.fn() },  // Função simulada para registrar interceptors de requisição
        response: { use: vi.fn() }  // Função simulada para registrar interceptors de resposta
    };

    const mockCreate = vi.fn(() => ({
        interceptors: mockInterceptors
    }));

    return { default: {
        create: mockCreate,
        mockInterceptors } 
    };
});

// Configuração do mock para o módulo de configuração
vi.mock('@/../config', () => ({
    __esModule: true,
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

describe('api', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Importa o módulo api para executar a configuração
        vi.resetModules();
        await import('@/services/api');
    });

    test('creates axios instance with correct config', async () => {
        // Importa o módulo de configuração mockado
        const { default: config } = await import('@/../config');

        expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
            baseURL: config.API_BASE_URL,
            headers: expect.objectContaining({
                'Content-Type': 'application/json'
            })
        }));
    });

    test('adds request interceptor', () => {
        // Acessa o mock interceptors diretamente do axios mockado
        expect(axios.mockInterceptors.request.use).toHaveBeenCalled();
    });

    test('adds response interceptor', () => {
        // Acessa o mock interceptors diretamente do axios mockado
        expect(axios.mockInterceptors.response.use).toHaveBeenCalled();
    });
});