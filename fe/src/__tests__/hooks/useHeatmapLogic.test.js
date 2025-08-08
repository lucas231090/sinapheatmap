import { renderHook, act, waitFor } from '@testing-library/react';
import useHeatmapLogic from '@/hooks/useHeatmapLogic';
import { getFileById } from '@/services/fileService';
import * as utils from '@/utils';

jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

// Mock dos serviços e utils
jest.mock('@/services/fileService');
jest.mock('@/utils', () => ({
    calculateResponsiveScale: jest.fn(),
    calculateCanvasSize: jest.fn(),
    combineCoordinates: jest.fn(),
    validateCoordinates: jest.fn(),
    scaleCoordinates: jest.fn(),
    downloadHeatMapImage: jest.fn(),
}));

// Mock do window object
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
});

describe('useHeatmapLogic', () => {
    const mockFileData = {
        filename: 'test-file.csv',
        jsonData: [
            { test: 'test1', coordinates: [[100, 200], [150, 250]] },
            { test: 'test2', coordinates: [[200, 300], [250, 350]] }
        ],
        mediaPath: 'test-media.jpg'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset window size
        window.innerWidth = 1024;
        window.innerHeight = 768;

        // Setup default mock implementations
        utils.calculateResponsiveScale.mockReturnValue(1);
        utils.calculateCanvasSize.mockReturnValue({ width: 800, height: 600 });
        utils.combineCoordinates.mockReturnValue([[100, 200], [150, 250]]);
        utils.validateCoordinates.mockReturnValue([[100, 200], [150, 250]]);
        utils.scaleCoordinates.mockReturnValue([[100, 200], [150, 250]]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should initialize with default values', () => {
        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        expect(result.current.fileName).toBeUndefined();
        expect(result.current.dataFile).toBeUndefined();
        expect(result.current.jsonFile).toBeUndefined();
        expect(result.current.img).toBeNull();
        expect(result.current.coords).toEqual([]);
        expect(result.current.radiusScale).toBe(1);
        expect(result.current.canvasSize).toEqual({ width: 0, height: 0 });
        expect(result.current.isLoading).toBe(true); // Should be true when ID is provided
        expect(result.current.error).toBeNull();
        expect(result.current.windowSize).toEqual({ width: 1024, height: 768 });
    });

    test('should fetch data when id is provided', async () => {
        getFileById.mockResolvedValue(mockFileData);

        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getFileById).toHaveBeenCalledWith('test-id');
        expect(result.current.fileName).toBe('test-file.csv');
        expect(result.current.dataFile).toEqual(mockFileData);
        expect(result.current.error).toBeNull();
    });

    test('should handle fetch error', async () => {
        const errorMessage = 'Failed to fetch data';
        getFileById.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.dataFile).toBeUndefined();
    });

    test('should process heatmap data when jsonFile and dataFile are available', async () => {
        getFileById.mockResolvedValue(mockFileData);

        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        await waitFor(() => {
            expect(result.current.coords).toEqual([[100, 200], [150, 250]]);
        });

        expect(utils.calculateResponsiveScale).toHaveBeenCalled();
        expect(utils.calculateCanvasSize).toHaveBeenCalled();
        expect(utils.combineCoordinates).toHaveBeenCalled();
        expect(utils.validateCoordinates).toHaveBeenCalled();
        expect(utils.scaleCoordinates).toHaveBeenCalled();
    });

    test('should update window size on resize', () => {
        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        act(() => {
            window.innerWidth = 1920;
            window.innerHeight = 1080;
            window.dispatchEvent(new Event('resize'));
        });

        expect(result.current.windowSize).toEqual({ width: 1920, height: 1080 });
    });

    test('should handle empty coordinates gracefully', async () => {
        getFileById.mockResolvedValue(mockFileData);
        utils.validateCoordinates.mockReturnValue([]);

        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        await waitFor(() => {
            expect(result.current.coords).toEqual([]);
        });
    });

    test('should call downloadHeatMapImage with correct parameters', async () => {
        getFileById.mockResolvedValue(mockFileData);

        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        await waitFor(() => {
            expect(result.current.fileName).toBe('test-file.csv');
        });

        const mockCanvasRefs = {
            heatmapCanvasRef: { current: {} },
            canvasRef: { current: {} },
            imgRef: { current: {} }
        };

        act(() => {
            result.current.downloadHeatMap(mockCanvasRefs);
        });

        expect(utils.downloadHeatMapImage).toHaveBeenCalledWith({
            ...mockCanvasRefs,
            canvasSize: result.current.canvasSize,
            fileName: 'test-file.csv'
        });
    });

    test('should reprocess data when updateTestSelection is called', async () => {
        getFileById.mockResolvedValue(mockFileData);

        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        await waitFor(() => {
            expect(result.current.dataFile).toEqual(mockFileData);
        });

        // Clear previous calls
        jest.clearAllMocks();

        act(() => {
            result.current.updateTestSelection('0');
        });

        // Should trigger reprocessing
        await waitFor(() => {
            expect(utils.combineCoordinates).toHaveBeenCalled();
        });
    });

    test('should handle processing error gracefully', async () => {
        getFileById.mockResolvedValue(mockFileData);
        utils.calculateResponsiveScale.mockImplementation(() => {
            throw new Error('Processing error');
        });

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        await waitFor(() => {
            expect(result.current.coords).toEqual([]);
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Erro ao processar dados do heatmap:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    test('should refetch data when refetchData is called', async () => {
        getFileById.mockResolvedValue(mockFileData);

        const { result } = renderHook(() => useHeatmapLogic('test-id', 'all'));

        await waitFor(() => {
            expect(result.current.dataFile).toEqual(mockFileData);
        });

        // Clear previous calls
        jest.clearAllMocks();
        getFileById.mockResolvedValue({ ...mockFileData, filename: 'new-file.csv' });

        await act(async () => {
            await result.current.refetchData();
        });

        expect(getFileById).toHaveBeenCalledWith('test-id');
        expect(result.current.fileName).toBe('new-file.csv');
    });
});
