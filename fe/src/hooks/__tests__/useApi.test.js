import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from '../useApi';
import api from '../../services/api';

/**
 * Mock do módulo de serviço de API
 * Substitui as chamadas HTTP reais por funções simuladas para testes
 */
jest.mock('../../services/api', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
}));

describe('useApi hook', () => {
    /**
     * Limpa todos os mocks antes de cada teste
     * Garante que cada teste comece com um estado limpo
     */
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Verifica se o hook retorna o estado inicial esperado
     */
    test('should return initial state', () => {
        const { result } = renderHook(() => useApi());
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.get).toBe('function');
        expect(typeof result.current.post).toBe('function');
        expect(typeof result.current.put).toBe('function');
        expect(typeof result.current.delete).toBe('function');
    });

    /**
     * Testa se o método GET processa requisições bem-sucedidas corretamente
     */
    test('get method should handle successful requests', async () => {
        const mockResponse = { data: [{ id: 1, name: 'Test' }] };
        api.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useApi());

        let getPromise;
        act(() => {
            getPromise = result.current.get('/eyetracking');
        });

        // Loading deve ser true imediatamente após a requisição iniciar
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();

        // Aguarda a atualização assíncrona do estado
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Após a conclusão da requisição, loading deve ser false
        expect(result.current.error).toBeNull();

        // Verifica se a Promise resolve com os dados esperados
        const data = await getPromise;
        expect(data).toEqual(mockResponse.data);

        // Verifica se api.get foi chamada com o URL correto
        // Verificamos apenas o primeiro parâmetro sem se importar com os outros
        expect(api.get.mock.calls[0][0]).toBe('/eyetracking');
    });

    /**
     * Testa se o método POST processa requisições bem-sucedidas corretamente
     */
    test('post method should handle successful requests', async () => {
        const mockResponse = { data: { id: 1, name: 'Created Item' } };
        api.post.mockResolvedValueOnce(mockResponse);
        const postData = { name: 'New Item' };

        const { result } = renderHook(() => useApi());

        let postPromise;
        act(() => {
            postPromise = result.current.post('/heatmap', postData);
        });

        expect(result.current.loading).toBe(true);

        // Aguarda a conclusão da requisição
        await waitFor(() => expect(result.current.loading).toBe(false));

        const data = await postPromise;
        expect(data).toEqual(mockResponse.data);
        expect(api.post).toHaveBeenCalledWith('/heatmap', postData);
    });

    /**
     * Testa se o método PUT processa requisições bem-sucedidas corretamente
     */
    test('put method should handle successful requests', async () => {
        const mockResponse = { data: { id: 1, name: 'Updated Item' } };
        api.put.mockResolvedValueOnce(mockResponse);
        const putData = { name: 'Updated Item' };

        const { result } = renderHook(() => useApi());

        let putPromise;
        act(() => {
            putPromise = result.current.put('/eyetracking/1', putData);
        });

        expect(result.current.loading).toBe(true);

        // Aguarda a conclusão da requisição
        await waitFor(() => expect(result.current.loading).toBe(false));

        const data = await putPromise;
        expect(data).toEqual(mockResponse.data);
        expect(api.put).toHaveBeenCalledWith('/eyetracking/1', putData);
    });

    /**
     * Testa se o método DELETE processa requisições bem-sucedidas corretamente
     */
    test('delete method should handle successful requests', async () => {
        const mockResponse = { data: { success: true } };
        api.delete.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useApi());

        let deletePromise;
        act(() => {
            deletePromise = result.current.delete('/test-url/1');
        });

        expect(result.current.loading).toBe(true);

        // Aguarda a conclusão da requisição
        await waitFor(() => expect(result.current.loading).toBe(false));

        const data = await deletePromise;
        expect(data).toEqual(mockResponse.data);

        // Verifica apenas o primeiro parâmetro
        expect(api.delete.mock.calls[0][0]).toBe('/test-url/1');
    });

    /**
     * Testa o tratamento de erros nas requisições
     */
    test('should handle error responses', async () => {
        const errorResponse = {
            response: {
                data: {
                    message: 'Resource not found'
                },
                status: 404
            }
        };

        // Configura o mock para retornar uma promessa rejeitada
        api.get.mockImplementationOnce(() => Promise.reject(errorResponse));

        const { result } = renderHook(() => useApi());

        // Evita que erros não capturados sejam propagados ao ambiente de teste
        let errorThrown = false;

        act(() => {
            // Não armazenamos a promessa para evitar problemas com rejeições não tratadas
            result.current.get('/not-found').catch(() => {
                errorThrown = true;
            });
        });

        expect(result.current.loading).toBe(true);

        // Aguarda o processamento do erro
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Verifica se o estado de erro foi atualizado corretamente
        expect(result.current.error).toBe('Resource not found');

        // Verifica se a API foi chamada
        expect(api.get).toHaveBeenCalled();
    });

    /**
     * Testa o tratamento de erros sem mensagem específica
     */
    test('should handle error without response data message', async () => {
        // Cria um erro genérico sem estrutura específica
        const genericError = new Error('Network Error');

        // Configura o mock para retornar uma promessa rejeitada
        api.get.mockImplementationOnce(() => Promise.reject(genericError));

        const { result } = renderHook(() => useApi());

        // Evita que erros não capturados sejam propagados ao ambiente de teste
        let errorThrown = false;

        act(() => {
            // Não armazenamos a promessa para evitar problemas
            result.current.get('/network-error').catch(() => {
                errorThrown = true;
            });
        });

        expect(result.current.loading).toBe(true);

        // Aguarda o processamento do erro
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Verifica se o estado de erro foi atualizado com a mensagem padrão
        expect(result.current.error).toBe('Ocorreu um erro na requisição');

        // Verifica se a API foi chamada
        expect(api.get).toHaveBeenCalled();
    });
});