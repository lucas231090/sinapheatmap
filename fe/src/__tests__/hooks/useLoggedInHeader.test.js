import { renderHook } from '@testing-library/react';
import useLoggedInHeader from '@/hooks/useLoggedInHeader';
import { useTheme } from '@/hooks/useTheme';

// Mock do hook useTheme
jest.mock('@/hooks/useTheme');

jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

describe('useLoggedInHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return logoSrc from useTheme hook', () => {
        const mockLogoSrc = '/SinapsenseLogo.png';
        useTheme.mockReturnValue({
            isDark: false,
            logoSrc: mockLogoSrc,
        });

        const { result } = renderHook(() => useLoggedInHeader());

        expect(result.current.logoSrc).toBe(mockLogoSrc);
        expect(useTheme).toHaveBeenCalledTimes(1);
    });

    test('should return dark mode logo when theme is dark', () => {
        const mockDarkLogoSrc = '/SinapsenseLogoDarkMode.png';
        useTheme.mockReturnValue({
            isDark: true,
            logoSrc: mockDarkLogoSrc,
        });

        const { result } = renderHook(() => useLoggedInHeader());

        expect(result.current.logoSrc).toBe(mockDarkLogoSrc);
    });

    test('should update logoSrc when useTheme changes', () => {
        const { result, rerender } = renderHook(() => useLoggedInHeader());

        // First render with light theme
        useTheme.mockReturnValue({
            isDark: false,
            logoSrc: '/SinapsenseLogo.png',
        });

        rerender();

        expect(result.current.logoSrc).toBe('/SinapsenseLogo.png');

        // Second render with dark theme
        useTheme.mockReturnValue({
            isDark: true,
            logoSrc: '/SinapsenseLogoDarkMode.png',
        });

        rerender();

        expect(result.current.logoSrc).toBe('/SinapsenseLogoDarkMode.png');
    });

    test('should call useTheme on every render', () => {
        const { rerender } = renderHook(() => useLoggedInHeader());

        expect(useTheme).toHaveBeenCalledTimes(1);

        rerender();

        expect(useTheme).toHaveBeenCalledTimes(2);

        rerender();

        expect(useTheme).toHaveBeenCalledTimes(3);
    });

    test('should handle undefined logoSrc from useTheme', () => {
        useTheme.mockReturnValue({
            isDark: false,
            logoSrc: undefined,
        });

        const { result } = renderHook(() => useLoggedInHeader());

        expect(result.current.logoSrc).toBeUndefined();
    });

    test('should handle null logoSrc from useTheme', () => {
        useTheme.mockReturnValue({
            isDark: false,
            logoSrc: null,
        });

        const { result } = renderHook(() => useLoggedInHeader());

        expect(result.current.logoSrc).toBeNull();
    });

    test('should not break if useTheme returns different structure', () => {
        useTheme.mockReturnValue({
            differentProperty: 'value',
        });

        const { result } = renderHook(() => useLoggedInHeader());

        expect(result.current.logoSrc).toBeUndefined();
    });

    test('should maintain consistency with useTheme calls', () => {
        const mockThemeData = {
            isDark: true,
            logoSrc: '/SinapsenseLogoDarkMode.png',
            otherProperty: 'value',
        };

        useTheme.mockReturnValue(mockThemeData);

        const { result } = renderHook(() => useLoggedInHeader());

        expect(useTheme).toHaveBeenCalledWith();
        expect(result.current.logoSrc).toBe(mockThemeData.logoSrc);
    });
});
