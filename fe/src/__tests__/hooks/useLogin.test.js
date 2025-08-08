import { renderHook, act } from '@testing-library/react';
import { useLogin } from '@/hooks/useLogin';
import { AuthContext } from '@/context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock do módulo de configuração para evitar problemas com import.meta.env
jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

// Mock do useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock do contexto de autenticação
const mockLogin = jest.fn();
const mockAuthContext = {
    login: mockLogin,
    user: null,
    logout: jest.fn(),
};

const wrapper = ({ children }) => (
    <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
            {children}
        </AuthContext.Provider>
    </BrowserRouter>
);

describe('useLogin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize with empty values', () => {
        const { result } = renderHook(() => useLogin(), { wrapper });

        expect(result.current.email).toBe('');
        expect(result.current.password).toBe('');
        expect(result.current.error).toBe('');
        expect(result.current.isLoading).toBe(false);
    });

    test('should update email and password', () => {
        const { result } = renderHook(() => useLogin(), { wrapper });

        act(() => {
            result.current.setEmail('test@example.com');
            result.current.setPassword('password123');
        });

        expect(result.current.email).toBe('test@example.com');
        expect(result.current.password).toBe('password123');
    });

    test('should handle successful login', async () => {
        mockLogin.mockResolvedValue();
        const { result } = renderHook(() => useLogin(), { wrapper });

        // Configurar valores
        act(() => {
            result.current.setEmail('test@example.com');
            result.current.setPassword('password123');
        });

        // Simular submit
        const mockEvent = { preventDefault: jest.fn() };

        await act(async () => {
            await result.current.handleSubmit(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/');
        expect(result.current.error).toBe('');
    });

    test('should handle login error', async () => {
        const errorMessage = 'Login failed';
        mockLogin.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useLogin(), { wrapper });

        // Configurar valores
        act(() => {
            result.current.setEmail('test@example.com');
            result.current.setPassword('wrongpassword');
        });

        // Simular submit
        const mockEvent = { preventDefault: jest.fn() };

        await act(async () => {
            await result.current.handleSubmit(mockEvent);
        });

        expect(result.current.error).toBe('Falha no login. Verifique seu email e senha.');
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should clear form', () => {
        const { result } = renderHook(() => useLogin(), { wrapper });

        // Configurar valores
        act(() => {
            result.current.setEmail('test@example.com');
            result.current.setPassword('password123');
        });

        // Limpar formulário
        act(() => {
            result.current.clearForm();
        });

        expect(result.current.email).toBe('');
        expect(result.current.password).toBe('');
        expect(result.current.error).toBe('');
    });

    test('should clear error', async () => {
        // Simular erro de login ANTES de renderizar o hook
        mockLogin.mockRejectedValue(new Error('Login failed'));

        const { result } = renderHook(() => useLogin(), { wrapper });

        // Configurar valores
        act(() => {
            result.current.setEmail('test@example.com');
            result.current.setPassword('wrongpassword');
        });

        const mockEvent = { preventDefault: jest.fn() };

        // Executar handleSubmit e aguardar conclusão
        await act(async () => {
            await result.current.handleSubmit(mockEvent);
        });

        // Verificar se erro foi definido
        expect(result.current.error).toBe('Falha no login. Verifique seu email e senha.');

        // Limpar erro
        act(() => {
            result.current.clearError();
        });

        expect(result.current.error).toBe('');
    });
});
