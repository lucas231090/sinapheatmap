import { renderHook, act, waitFor } from '@testing-library/react';
import useHeatmapVideoLogic from '@/hooks/useHeatmapVideoLogic';
import useHeatmapLogic from '@/hooks/useHeatmapLogic';

// Mock do hook useHeatmapLogic
jest.mock('@/hooks/useHeatmapLogic');

jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

// Mock do setTimeout para testes
jest.useFakeTimers();

describe('useHeatmapVideoLogic', () => {
    const mockHeatmapLogic = {
        fileName: 'test-video.mp4',
        dataFile: {
            jsonData: [
                { test: 'test1', coordinates: [[100, 200], [150, 250]] },
                { test: 'test2', coordinates: [[200, 300], [250, 350]] }
            ]
        },
        img: null,
        coords: [[100, 200], [150, 250], [200, 300]],
        canvasSize: { width: 1280, height: 720 },
        radiusScale: 1,
        isLoading: false,
        error: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useHeatmapLogic.mockReturnValue(mockHeatmapLogic);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.useFakeTimers();
    });

    test('should initialize with default values', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        // Check refs are initialized
        expect(result.current.playerRef).toBeDefined();
        expect(result.current.canvasRef).toBeDefined();
        expect(result.current.heatmapCanvasRef).toBeDefined();
        expect(result.current.imgRef).toBeDefined();

        // Check video states
        expect(result.current.isPlaying).toBe(false);
        expect(result.current.showPlayer).toBe(false);
        expect(result.current.playbackSpeed).toBe(1);
        expect(result.current.selectedTestIndex).toBe('');
        expect(result.current.autoSelectedTest).toBeNull();
    });

    test('should pass correct parameters to useHeatmapLogic', () => {
        renderHook(() => useHeatmapVideoLogic('test-id'));

        expect(useHeatmapLogic).toHaveBeenCalledWith('test-id', '');
    });

    test('should auto-select test when only one test is available', async () => {
        const singleTestData = {
            ...mockHeatmapLogic,
            dataFile: {
                jsonData: [{ test: 'test1', coordinates: [[100, 200]] }]
            }
        };
        useHeatmapLogic.mockReturnValue(singleTestData);

        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        await waitFor(() => {
            expect(result.current.autoSelectedTest).toBe('0');
        });

        expect(result.current.hasSingleTest).toBe(true);
        expect(result.current.shouldShowSelector).toBe(false);
        expect(result.current.currentTestIndex).toBe('0');
    });

    test('should show selector when multiple tests are available', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        expect(result.current.hasSingleTest).toBe(false);
        expect(result.current.shouldShowSelector).toBe(true);
    });

    test('should handle test selection correctly', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        act(() => {
            const returnedIndex = result.current.handleTestSelect('1');
            expect(returnedIndex).toBe('1');
        });

        expect(result.current.selectedTestIndex).toBe('1');
        expect(result.current.autoSelectedTest).toBeNull();
        expect(result.current.showPlayer).toBe(false);
    });

    test('should start video when coords are available', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        act(() => {
            result.current.handleVideoStart();
        });

        expect(result.current.showPlayer).toBe(true);
    });

    test('should not start video when coords are empty', () => {
        useHeatmapLogic.mockReturnValue({
            ...mockHeatmapLogic,
            coords: []
        });

        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        act(() => {
            result.current.handleVideoStart();
        });

        expect(result.current.showPlayer).toBe(false);
    });

    test('should calculate correct video dimensions with fallbacks', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        expect(result.current.width).toBe(1280);
        expect(result.current.height).toBe(720);
    });

    test('should calculate correct video dimensions with invalid canvas size', () => {
        useHeatmapLogic.mockReturnValue({
            ...mockHeatmapLogic,
            canvasSize: { width: 'invalid', height: 'invalid' }
        });

        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        expect(result.current.width).toBe(1280);
        expect(result.current.height).toBe(720);
    });

    test('should calculate total frames correctly', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        const expectedFrames = 3 * 10 + 60; // 3 coords * 10 frames per point + 60
        expect(result.current.totalFrames).toBe(expectedFrames);
    });

    test('should use default total frames when no valid data', () => {
        useHeatmapLogic.mockReturnValue({
            ...mockHeatmapLogic,
            coords: [],
            canvasSize: { width: 0, height: 0 }
        });

        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        expect(result.current.totalFrames).toBe(150);
        expect(result.current.hasValidData).toBe(false);
    });

    test('should prepare heatmap data correctly', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        expect(result.current.heatmapData).toEqual({
            coords: [[100, 200], [150, 250], [200, 300]],
            radiusScale: 1,
            canvasSize: {
                width: 1280,
                height: 720,
            },
        });
    });

    test('should restart player when test selection changes', async () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        act(() => {
            result.current.handleTestSelect('1');
        });

        // Fast-forward the setTimeout
        act(() => {
            jest.advanceTimersByTime(100);
        });

        // The playerKey should be incremented when test changes
        expect(result.current.playerKey).toBeGreaterThan(0);
    });

    test('should delegate data properties from useHeatmapLogic', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        expect(result.current.fileName).toBe(mockHeatmapLogic.fileName);
        expect(result.current.dataFile).toBe(mockHeatmapLogic.dataFile);
        expect(result.current.img).toBe(mockHeatmapLogic.img);
        expect(result.current.isLoading).toBe(mockHeatmapLogic.isLoading);
        expect(result.current.error).toBe(mockHeatmapLogic.error);
    });

    test('should handle currentTestIndex correctly with manual selection', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        act(() => {
            result.current.handleTestSelect('1');
        });

        expect(result.current.currentTestIndex).toBe('1');
    });

    test('should handle currentTestIndex correctly with auto selection', async () => {
        const singleTestData = {
            ...mockHeatmapLogic,
            dataFile: {
                jsonData: [{ test: 'test1', coordinates: [[100, 200]] }]
            }
        };
        useHeatmapLogic.mockReturnValue(singleTestData);

        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        await waitFor(() => {
            expect(result.current.currentTestIndex).toBe('0');
        });
    });

    test('should not auto-select when user has already selected a test', () => {
        const singleTestData = {
            ...mockHeatmapLogic,
            dataFile: {
                jsonData: [{ test: 'test1', coordinates: [[100, 200]] }]
            }
        };
        useHeatmapLogic.mockReturnValue(singleTestData);

        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        // First select a test manually
        act(() => {
            result.current.handleTestSelect('0');
        });

        // Auto-selection should not override manual selection
        expect(result.current.autoSelectedTest).toBeNull();
        expect(result.current.selectedTestIndex).toBe('0');
    });

    test('should update playback speed', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        act(() => {
            result.current.setPlaybackSpeed(2);
        });

        expect(result.current.playbackSpeed).toBe(2);
    });

    test('should update playing state', () => {
        const { result } = renderHook(() => useHeatmapVideoLogic('test-id'));

        act(() => {
            result.current.setIsPlaying(true);
        });

        expect(result.current.isPlaying).toBe(true);
    });
});
