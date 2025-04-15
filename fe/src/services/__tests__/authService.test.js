/**
 * Testes unitários para o serviço de autenticação (authService)
 * Verifica as funções de login, registro, logout e verificação de autenticação
 */
import { loginUser, registerUser, logout, isAuthenticated } from '../authService';
import api from '../api';

/**
 * Mock do módulo api
 * Substitui o módulo real da API por funções simuladas (mocks)
 * para evitar chamadas HTTP reais durante os testes
 */
jest.mock('../api', () => ({
    post: jest.fn(),  // Cria uma função Jest mock para api.post
}));

describe('authService', () => {
    /**
     * Antes de cada teste, limpa todos os mocks e o localStorage
     * para garantir que cada teste comece com um estado limpo
     */
    beforeEach(() => {
        jest.clearAllMocks();  // Limpa histórico e implementações de mocks
        localStorage.clear();  // Limpa todos os dados do localStorage
    });

    /**
     * Testes para a função loginUser
     */
    describe('loginUser', () => {
        test('should call api.post with correct parameters', async () => {
            // Mock de resposta bem-sucedida da API
            api.post.mockResolvedValueOnce({
                data: { accessToken: 'test-token' }
            });

            // Executa a função que está sendo testada
            await loginUser('test@example.com', 'password123');

            // Verifica se api.post foi chamado com os parâmetros corretos
            expect(api.post).toHaveBeenCalledWith('/sign-in', {
                email: 'test@example.com',
                password: 'password123'
            });

            // Verifica se o token retornado foi armazenado corretamente no localStorage
            expect(localStorage.getItem('accessToken')).toBe('test-token');
        });

        test('should throw error when api call fails', async () => {
            // Mock de erro para simular falha na chamada à API
            const error = new Error('Authentication failed');
            api.post.mockRejectedValueOnce(error);

            // Verifica se a função rejeita com o erro esperado
            await expect(loginUser('wrong@example.com', 'wrongpass'))
                .rejects
                .toThrow(error);

            // Verifica se nenhum token foi armazenado no localStorage em caso de erro
            expect(localStorage.getItem('accessToken')).toBeNull();
        });
    });

    /**
     * Testes para a função registerUser
     */
    describe('registerUser', () => {
        test('should call api.post with correct parameters', async () => {
            // Mock de resposta bem-sucedida da API
            api.post.mockResolvedValueOnce({
                data: { success: true }
            });

            // Executa a função que está sendo testada
            await registerUser('Test User', 'test@example.com', 'password123');

            // Verifica se api.post foi chamado com os parâmetros corretos
            expect(api.post).toHaveBeenCalledWith('/sign-up', {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        });

        test('should throw error when registration fails', async () => {
            // Mock de erro para simular falha no registro
            const error = new Error('Email already in use');
            api.post.mockRejectedValueOnce(error);

            // Verifica se a função rejeita com o erro esperado
            await expect(registerUser('Test User', 'existing@example.com', 'password123'))
                .rejects
                .toThrow(error);
        });
    });

    /**
     * Testes para a função logout
     */
    describe('logout', () => {
        test('should remove token from localStorage', () => {
            // Configura um token no localStorage para simular usuário autenticado
            localStorage.setItem('accessToken', 'test-token');

            // Executa a função de logout
            logout();

            // Verifica se o token foi removido do localStorage
            expect(localStorage.getItem('accessToken')).toBeNull();
        });
    });

    /**
     * Testes para a função isAuthenticated
     */
    describe('isAuthenticated', () => {
        test('should return true when token exists', () => {
            // Configura um token no localStorage
            localStorage.setItem('accessToken', 'test-token');

            // Verifica se a função retorna true quando há token
            expect(isAuthenticated()).toBe(true);
        });

        test('should return false when token does not exist', () => {
            // Garante que não há token no localStorage
            localStorage.clear();

            // Verifica se a função retorna false quando não há token
            expect(isAuthenticated()).toBe(false);
        });
    });
});