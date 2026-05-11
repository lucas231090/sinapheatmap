import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import useLayout from '@/hooks/useLayout';
import { AuthContext } from '@/context/AuthContext';
import { createElement } from 'react';

// Mock do react-router-dom
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn(),
}));

jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

// Mock do contexto de autenticação
const mockAuthContext = {
    isLoggedIn: true,
    logout: jest.fn(),
};

// Wrapper para prover o contexto
const wrapper = ({ children }) =>
    createElement(AuthContext.Provider, { value: mockAuthContext }, children);

describe('useLayout', () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);

        // Reset document classes
        document.documentElement.classList.remove('dark');

        // Reset auth context
        mockAuthContext.isLoggedIn = true;
        mockAuthContext.logout = jest.fn();
    });

    test('should initialize with light mode when no dark class exists', () => {
        const { result } = renderHook(() => useLayout(), { wrapper });

        expect(result.current.darkMode).toBe(false);
        expect(result.current.isLoggedIn).toBe(true);
    });

    test('should initialize with dark mode when dark class exists', () => {
        document.documentElement.classList.add('dark');

        const { result } = renderHook(() => useLayout(), { wrapper });

        expect(result.current.darkMode).toBe(true);
    });

    test('should toggle dark mode correctly', () => {
        const { result } = renderHook(() => useLayout(), { wrapper });

        // Initially light mode
        expect(result.current.darkMode).toBe(false);
        expect(document.documentElement.classList.contains('dark')).toBe(false);

        // Toggle to dark mode
        act(() => {
            result.current.toggleDarkMode();
        });

        expect(result.current.darkMode).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        // Toggle back to light mode
        act(() => {
            result.current.toggleDarkMode();
        });

        expect(result.current.darkMode).toBe(false);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    test('should handle logout correctly', () => {
        const { result } = renderHook(() => useLayout(), { wrapper });

        act(() => {
            result.current.handleLogout();
        });

        expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should reflect authentication state changes', () => {
        const { result, rerender } = renderHook(() => useLayout(), { wrapper });

        expect(result.current.isLoggedIn).toBe(true);

        // Change auth state
        mockAuthContext.isLoggedIn = false;
        rerender();

        expect(result.current.isLoggedIn).toBe(false);
    });

    test('should maintain stable function references', () => {
        const { result, rerender } = renderHook(() => useLayout(), { wrapper });

        const initialToggleDarkMode = result.current.toggleDarkMode;
        const initialHandleLogout = result.current.handleLogout;

        rerender();

        expect(result.current.toggleDarkMode).toBe(initialToggleDarkMode);
        expect(result.current.handleLogout).toBe(initialHandleLogout);
    });

    test('should sync dark mode state with document class changes from external sources', () => {
        const { result } = renderHook(() => useLayout(), { wrapper });

        // Initially light mode
        expect(result.current.darkMode).toBe(false);

        // Manually add dark class (simulating external change)
        act(() => {
            document.documentElement.classList.add('dark');
        });

        // Re-render to check if hook detects the change
        // Note: This tests the initialization logic, as the hook doesn't actively watch for external changes
        const { result: newResult } = renderHook(() => useLayout(), { wrapper });
        expect(newResult.current.darkMode).toBe(true);
    });

    test('should handle multiple rapid toggles correctly', () => {
        const { result } = renderHook(() => useLayout(), { wrapper });

        // Perform multiple rapid toggles
        act(() => {
            result.current.toggleDarkMode(); // light -> dark
            result.current.toggleDarkMode(); // dark -> light
            result.current.toggleDarkMode(); // light -> dark
        });

        expect(result.current.darkMode).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    test('should work correctly when AuthContext provides different logout function', () => {
        const customLogout = jest.fn();
        const customAuthContext = {
            isLoggedIn: true,
            logout: customLogout,
        };

        const customWrapper = ({ children }) =>
            createElement(AuthContext.Provider, { value: customAuthContext }, children);

        const { result } = renderHook(() => useLayout(), { wrapper: customWrapper });

        act(() => {
            result.current.handleLogout();
        });

        expect(customLogout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should handle navigation function changes', () => {
        const { result, rerender } = renderHook(() => useLayout(), { wrapper });

        const newNavigate = jest.fn();
        useNavigate.mockReturnValue(newNavigate);

        rerender();

        act(() => {
            result.current.handleLogout();
        });

        expect(newNavigate).toHaveBeenCalledWith('/login');
    });
});
