import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';


jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

// Mock do MutationObserver
global.MutationObserver = class {
    constructor(callback) {
        this.callback = callback;
    }

    observe() {
        // Mock implementation
    }

    disconnect() {
        // Mock implementation
    }
};

describe('useTheme', () => {
    beforeEach(() => {
        // Limpar classes do document
        document.documentElement.classList.remove('dark');
    });

    test('should initialize with light theme', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.isDark).toBe(false);
        expect(result.current.logoSrc).toBe('/SinapsenseLogo.png');
    });

    test('should detect dark theme when dark class is present', () => {
        // Adicionar classe dark ao document
        document.documentElement.classList.add('dark');

        const { result } = renderHook(() => useTheme());

        expect(result.current.isDark).toBe(true);
        expect(result.current.logoSrc).toBe('/SinapsenseLogoDarkMode.png');
    });

    test('should provide updateTheme function', () => {
        const { result } = renderHook(() => useTheme());

        expect(typeof result.current.updateTheme).toBe('function');

        // Mudar para dark theme e chamar updateTheme
        document.documentElement.classList.add('dark');

        act(() => {
            result.current.updateTheme();
        });

        expect(result.current.isDark).toBe(true);
        expect(result.current.logoSrc).toBe('/SinapsenseLogoDarkMode.png');
    });
});
