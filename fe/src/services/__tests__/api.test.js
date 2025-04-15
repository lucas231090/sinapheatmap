/**
 * Teste unitário para o módulo api
 * Verifica a configuração do axios e setup dos interceptors
 */
import axios from 'axios';
import api from '../api';

/**
 * Mock completo para o axios
 * Cria uma versão simulada do axios com todos os métodos necessários para teste
 */
jest.mock('axios', () => {
    // Cria objetos mock para os interceptors de requisição e resposta
    const mockInterceptors = {
        request: { use: jest.fn() },  // Função simulada para registrar interceptors de requisição
        response: { use: jest.fn() }  // Função simulada para registrar interceptors de resposta
    };

    const mockCreate = jest.fn(() => ({
        interceptors: mockInterceptors
    }));

    return {
        create: mockCreate,
        mockInterceptors // Expoe os interceptors mockados para acesso nos testes
    };
});

// Configuração do mock para o módulo de configuração
jest.mock('../../../config', () => ({
    __esModule: true,
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

describe('api', () => {
    test('creates axios instance with correct config', () => {
        // Impora o módulo de configuração mockado ao invés de referenciá-lo diretamente
        const { default: config } = require('../../../config');

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