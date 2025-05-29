import { renderHook, act } from '@testing-library/react';
import { useThemeManager } from '@/hooks/useThemeManager';


jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

// Mock do localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock do matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
});

describe('useThemeManager', () => {
    let mockMediaQuery;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset document classes
        document.documentElement.classList.remove('dark');

        // Setup default matchMedia mock
        mockMediaQuery = {
            matches: false,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        };
        mockMatchMedia.mockReturnValue(mockMediaQuery);

        // Clear localStorage
        localStorageMock.getItem.mockReturnValue(null);
    });

    test('should initialize with light theme when no saved theme and system prefers light', () => {
        mockMediaQuery.matches = false;

        const { result } = renderHook(() => useThemeManager());

        expect(result.current.isDark).toBe(false);
        expect(result.current.logoSrc).toBe('/SinapsenseLogo.png');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    test('should initialize with dark theme when no saved theme and system prefers dark', () => {
        mockMediaQuery.matches = true;

        const { result } = renderHook(() => useThemeManager());

        expect(result.current.isDark).toBe(true);
        expect(result.current.logoSrc).toBe('/SinapsenseLogoDarkMode.png');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    test('should initialize with saved dark theme', () => {
        localStorageMock.getItem.mockReturnValue('dark');

        const { result } = renderHook(() => useThemeManager());

        expect(result.current.isDark).toBe(true);
        expect(result.current.logoSrc).toBe('/SinapsenseLogoDarkMode.png');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    test('should initialize with saved light theme', () => {
        localStorageMock.getItem.mockReturnValue('light');

        const { result } = renderHook(() => useThemeManager());

        expect(result.current.isDark).toBe(false);
        expect(result.current.logoSrc).toBe('/SinapsenseLogo.png');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    test('should toggle theme from light to dark', () => {
        localStorageMock.getItem.mockReturnValue('light');

        const { result } = renderHook(() => useThemeManager());

        expect(result.current.isDark).toBe(false);

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.isDark).toBe(true);
        expect(result.current.logoSrc).toBe('/SinapsenseLogoDarkMode.png');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    test('should toggle theme from dark to light', () => {
        localStorageMock.getItem.mockReturnValue('dark');

        const { result } = renderHook(() => useThemeManager());

        expect(result.current.isDark).toBe(true);

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.isDark).toBe(false);
        expect(result.current.logoSrc).toBe('/SinapsenseLogo.png');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    test('should listen for system theme changes when no saved preference', () => {
        const { result } = renderHook(() => useThemeManager());

        expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
        expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
            'change',
            expect.any(Function)
        );

        // Simulate system theme change to dark
        const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];

        act(() => {
            changeHandler({ matches: true });
        });

        expect(result.current.isDark).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    test('should not respond to system theme changes when user has saved preference', () => {
        localStorageMock.getItem.mockReturnValue('light');

        const { result } = renderHook(() => useThemeManager());

        expect(result.current.isDark).toBe(false);

        // Simulate system theme change
        const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];

        act(() => {
            changeHandler({ matches: true });
        });

        // Should remain light because user has saved preference
        expect(result.current.isDark).toBe(false);
    });

    test('should cleanup event listener on unmount', () => {
        const { unmount } = renderHook(() => useThemeManager());

        unmount();

        expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
            'change',
            expect.any(Function)
        );
    });

    test('should maintain stable toggle function reference', () => {
        const { result, rerender } = renderHook(() => useThemeManager());

        const initialToggleTheme = result.current.toggleTheme;

        rerender();

        expect(result.current.toggleTheme).toBe(initialToggleTheme);
    });

    test('should handle multiple rapid toggles correctly', () => {
        const { result } = renderHook(() => useThemeManager());

        expect(result.current.isDark).toBe(false);

        act(() => {
            result.current.toggleTheme(); // light -> dark
            result.current.toggleTheme(); // dark -> light
            result.current.toggleTheme(); // light -> dark
        });

        expect(result.current.isDark).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'dark');
    });

    test('should apply theme correctly when applyTheme is called directly', () => {
        const { result } = renderHook(() => useThemeManager());

        // Test applying dark theme
        act(() => {
            result.current.toggleTheme();
        });

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');

        // Test applying light theme
        act(() => {
            result.current.toggleTheme();
        });

        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    test('should handle invalid localStorage values gracefully', () => {
        localStorageMock.getItem.mockReturnValue('invalid-theme');

        const { result } = renderHook(() => useThemeManager());

        // Should fallback to system preference
        expect(result.current.isDark).toBe(mockMediaQuery.matches);
    });

    test('should handle localStorage errors gracefully', () => {
        localStorageMock.getItem.mockImplementation(() => {
            throw new Error('localStorage not available');
        });

        const { result } = renderHook(() => useThemeManager());

        // Should fallback to system preference
        expect(result.current.isDark).toBe(mockMediaQuery.matches);
    });
});
