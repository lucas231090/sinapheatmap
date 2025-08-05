import { renderHook, act } from '@testing-library/react';
import useHeatmapStaticLogic from '@/hooks/useHeatmapStaticLogic';
import useHeatmapLogic from '@/hooks/useHeatmapLogic';
import { downloadHeatMapImage } from '@/utils';

// Mock do hook useHeatmapLogic
jest.mock('@/hooks/useHeatmapLogic');

// Mock da função de download
jest.mock('@/utils', () => ({
    downloadHeatMapImage: jest.fn(),
}));

jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

describe('useHeatmapStaticLogic', () => {
    const mockHeatmapLogic = {
        fileName: 'test-file.csv',
        dataFile: { jsonData: [] },
        jsonFile: null,
        img: null,
        coords: [[100, 200], [150, 250]],
        radiusScale: 1,
        canvasSize: { width: 800, height: 600 },
        windowSize: { width: 1024, height: 768 },
        isLoading: false,
        error: null,
        reprocessData: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useHeatmapLogic.mockReturnValue(mockHeatmapLogic);
    });

    test('should initialize with default values', () => {
        const { result } = renderHook(() => useHeatmapStaticLogic('test-id'));

        // Check refs are initialized
        expect(result.current.canvasRef).toBeDefined();
        expect(result.current.heatmapCanvasRef).toBeDefined();
        expect(result.current.imgRef).toBeDefined();

        // Check visibility states
        expect(result.current.canvasVisible).toBe(false);
        expect(result.current.heatmapCanvasVisible).toBe(true);

        // Check selection state
        expect(result.current.selectedTestIndex).toBe('all');
    });

    test('should pass correct parameters to useHeatmapLogic', () => {
        renderHook(() => useHeatmapStaticLogic('test-id'));

        expect(useHeatmapLogic).toHaveBeenCalledWith('test-id', 'all');
    });

    test('should update selectedTestIndex when setSelectedTestIndex is called', () => {
        const { result } = renderHook(() => useHeatmapStaticLogic('test-id'));

        act(() => {
            result.current.setSelectedTestIndex('0');
        });

        expect(result.current.selectedTestIndex).toBe('0');
    });

    test('should update canvas visibility states', () => {
        const { result } = renderHook(() => useHeatmapStaticLogic('test-id'));

        act(() => {
            result.current.setCanvasVisible(true);
        });

        expect(result.current.canvasVisible).toBe(true);

        act(() => {
            result.current.setHeatmapCanvasVisible(false);
        });

        expect(result.current.heatmapCanvasVisible).toBe(false);
    });

    test('should delegate all heatmap logic properties', () => {
        const { result } = renderHook(() => useHeatmapStaticLogic('test-id'));

        // Check that all properties from useHeatmapLogic are available
        expect(result.current.fileName).toBe(mockHeatmapLogic.fileName);
        expect(result.current.dataFile).toBe(mockHeatmapLogic.dataFile);
        expect(result.current.jsonFile).toBe(mockHeatmapLogic.jsonFile);
        expect(result.current.img).toBe(mockHeatmapLogic.img);
        expect(result.current.coords).toBe(mockHeatmapLogic.coords);
        expect(result.current.radiusScale).toBe(mockHeatmapLogic.radiusScale);
        expect(result.current.canvasSize).toBe(mockHeatmapLogic.canvasSize);
        expect(result.current.windowSize).toBe(mockHeatmapLogic.windowSize);
        expect(result.current.isLoading).toBe(mockHeatmapLogic.isLoading);
        expect(result.current.error).toBe(mockHeatmapLogic.error);
        expect(result.current.refetchData).toBe(mockHeatmapLogic.reprocessData);
    });

    test('should call downloadHeatMapImage with canvas references and visibility states', () => {
        const { result } = renderHook(() => useHeatmapStaticLogic('test-id'));

        // Set some visibility states
        act(() => {
            result.current.setCanvasVisible(true);
            result.current.setHeatmapCanvasVisible(false);
        });

        act(() => {
            result.current.downloadHeatMap();
        });

        expect(downloadHeatMapImage).toHaveBeenCalledWith({
            heatmapCanvasRef: result.current.heatmapCanvasRef,
            canvasRef: result.current.canvasRef,
            imgRef: result.current.imgRef,
            heatmapVisible: false,
            canvasVisible: true,
            canvasSize: mockHeatmapLogic.canvasSize,
            fileName: mockHeatmapLogic.fileName
        });
    });

    test('should re-render when selectedTestIndex changes and update useHeatmapLogic', () => {
        const { result, rerender } = renderHook(
            ({ id, selectedTestIndex }) => useHeatmapStaticLogic(id),
            { initialProps: { id: 'test-id', selectedTestIndex: 'all' } }
        );

        // Change selected test index
        act(() => {
            result.current.setSelectedTestIndex('1');
        });

        // Trigger re-render to update the hook with new selectedTestIndex
        rerender({ id: 'test-id', selectedTestIndex: '1' });

        // useHeatmapLogic should be called again with updated selectedTestIndex
        expect(useHeatmapLogic).toHaveBeenLastCalledWith('test-id', '1');
    });

    test('should maintain ref stability across re-renders', () => {
        const { result, rerender } = renderHook(() => useHeatmapStaticLogic('test-id'));

        const initialCanvasRef = result.current.canvasRef;
        const initialHeatmapCanvasRef = result.current.heatmapCanvasRef;
        const initialImgRef = result.current.imgRef;

        rerender();

        expect(result.current.canvasRef).toBe(initialCanvasRef);
        expect(result.current.heatmapCanvasRef).toBe(initialHeatmapCanvasRef);
        expect(result.current.imgRef).toBe(initialImgRef);
    });

    test('should handle id changes', () => {
        const { rerender } = renderHook(
            ({ id }) => useHeatmapStaticLogic(id),
            { initialProps: { id: 'test-id-1' } }
        );

        expect(useHeatmapLogic).toHaveBeenCalledWith('test-id-1', 'all');

        rerender({ id: 'test-id-2' });

        expect(useHeatmapLogic).toHaveBeenCalledWith('test-id-2', 'all');
    });
});
