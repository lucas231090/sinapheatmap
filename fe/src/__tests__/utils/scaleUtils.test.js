/**
 * Testes unitários para utilitários de cálculos responsivos
 * Verifica funções de escala, dimensões de canvas e raio do heatmap
 */
import {
    calculateResponsiveScale,
    calculateCanvasSize,
    calculateHeatmapRadius
} from '@/utils/scaleUtils';

describe('scaleUtils', () => {
    /**
     * Testes para a função calculateResponsiveScale
     * Verifica se a escala responsiva é calculada corretamente
     */
    describe('calculateResponsiveScale', () => {
        const mockJsonFile = {
            "Largura Tela": 1920,
            "Altura Tela": 1080
        };

        const mockWindowSize = {
            width: 1280,
            height: 720
        };

        test('calculates scale correctly for normal window size', () => {
            const result = calculateResponsiveScale(mockJsonFile, mockWindowSize);
            
            // A menor escala deve ser usada para manter proporção
            const expectedWidthScale = 1280 / 1920; // ≈ 0.667
            const expectedHeightScale = 720 / 1080; // ≈ 0.667
            const expectedScale = Math.min(expectedWidthScale, expectedHeightScale, 1);
            
            expect(result).toBeCloseTo(expectedScale, 3);
        });

        test('returns 1 when window is larger than original', () => {
            const largeWindowSize = {
                width: 2560,
                height: 1440
            };
            
            const result = calculateResponsiveScale(mockJsonFile, largeWindowSize);
            
            // Não deve escalar acima de 1
            expect(result).toBe(1);
        });

        test('returns minimum scale when window is very small', () => {
            const smallWindowSize = {
                width: 100,
                height: 50
            };
            
            const result = calculateResponsiveScale(mockJsonFile, smallWindowSize);
            
            // Deve retornar o mínimo de 0.1
            expect(result).toBe(0.1);
        });

        test('returns 1 when jsonFile is null or undefined', () => {
            expect(calculateResponsiveScale(null, mockWindowSize)).toBe(1);
            expect(calculateResponsiveScale(undefined, mockWindowSize)).toBe(1);
        });

        test('returns 1 when original dimensions are missing', () => {
            const invalidJsonFile = {
                "other_field": "value"
            };
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = calculateResponsiveScale(invalidJsonFile, mockWindowSize);
            
            expect(result).toBe(1);
            expect(consoleSpy).toHaveBeenCalledWith("Dimensões originais não encontradas no JSON");
            
            consoleSpy.mockRestore();
        });

        test('handles partial missing dimensions', () => {
            const partialJsonFile = {
                "Largura Tela": 1920
                // "Altura Tela" missing
            };
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = calculateResponsiveScale(partialJsonFile, mockWindowSize);
            
            expect(result).toBe(1);
            expect(consoleSpy).toHaveBeenCalledWith("Dimensões originais não encontradas no JSON");
            
            consoleSpy.mockRestore();
        });

        test('respects maximum scale limit', () => {
            const mockVeryLargeJsonFile = {
                "Largura Tela": 100,
                "Altura Tela": 50
            };
            
            const result = calculateResponsiveScale(mockVeryLargeJsonFile, mockWindowSize);
            
            // Mesmo que a escala calculada seja muito alta, deve ser limitada a 2
            expect(result).toBeLessThanOrEqual(2);
        });

        test('calculates width-limited scale', () => {
            const wideJsonFile = {
                "Largura Tela": 2560,
                "Altura Tela": 720  // Mesma altura que a janela
            };
            
            const result = calculateResponsiveScale(wideJsonFile, mockWindowSize);
            
            // Deve ser limitado pela largura
            const expectedScale = 1280 / 2560; // 0.5
            expect(result).toBeCloseTo(expectedScale, 3);
        });

        test('calculates height-limited scale', () => {
            const tallJsonFile = {
                "Largura Tela": 1280, // Mesma largura que a janela
                "Altura Tela": 1440
            };
            
            const result = calculateResponsiveScale(tallJsonFile, mockWindowSize);
            
            // Deve ser limitado pela altura
            const expectedScale = 720 / 1440; // 0.5
            expect(result).toBeCloseTo(expectedScale, 3);
        });
    });

    /**
     * Testes para a função calculateCanvasSize
     * Verifica se as dimensões do canvas são calculadas corretamente
     */
    describe('calculateCanvasSize', () => {
        const mockJsonFile = {
            "Largura Tela": "1920",
            "Altura Tela": "1080"
        };

        test('calculates canvas size with default scale', () => {
            const result = calculateCanvasSize(mockJsonFile);
            
            expect(result).toEqual({
                width: 1920,
                height: 1080
            });
        });

        test('calculates canvas size with custom scale', () => {
            const scale = 0.5;
            const result = calculateCanvasSize(mockJsonFile, scale);
            
            expect(result).toEqual({
                width: 960,  // 1920 * 0.5
                height: 540  // 1080 * 0.5
            });
        });

        test('rounds dimensions to integers', () => {
            const scale = 0.333; // Resulta em decimais
            const result = calculateCanvasSize(mockJsonFile, scale);
            
            expect(result.width).toBe(Math.round(1920 * 0.333));
            expect(result.height).toBe(Math.round(1080 * 0.333));
            expect(Number.isInteger(result.width)).toBe(true);
            expect(Number.isInteger(result.height)).toBe(true);
        });

        test('returns default dimensions when jsonFile is null', () => {
            const result = calculateCanvasSize(null);
            
            expect(result).toEqual({
                width: 1280,
                height: 720
            });
        });

        test('returns default dimensions when jsonFile is undefined', () => {
            const result = calculateCanvasSize(undefined);
            
            expect(result).toEqual({
                width: 1280,
                height: 720
            });
        });

        test('uses default dimensions when screen dimensions are missing', () => {
            const incompleteJsonFile = {
                "other_field": "value"
            };
            
            const result = calculateCanvasSize(incompleteJsonFile);
            
            expect(result).toEqual({
                width: 1280,
                height: 720
            });
        });

        test('handles string dimensions correctly', () => {
            const stringJsonFile = {
                "Largura Tela": "800.5",
                "Altura Tela": "600.7"
            };
            
            const result = calculateCanvasSize(stringJsonFile, 2);
            
            expect(result).toEqual({
                width: Math.round(800.5 * 2), // 1601
                height: Math.round(600.7 * 2)  // 1201
            });
        });

        test('handles invalid scale values', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Teste com escala inválida
            let result = calculateCanvasSize(mockJsonFile, NaN);
            expect(result).toEqual({ width: 1920, height: 1080 }); // Deve usar escala 1.0
            expect(consoleSpy).toHaveBeenCalledWith("Escala inválida:", NaN, "usando 1.0");
            
            // Teste com escala negativa
            result = calculateCanvasSize(mockJsonFile, -0.5);
            expect(result).toEqual({ width: 1920, height: 1080 });
            expect(consoleSpy).toHaveBeenCalledWith("Escala inválida:", -0.5, "usando 1.0");
            
            // Teste com escala muito alta
            result = calculateCanvasSize(mockJsonFile, 15);
            expect(result).toEqual({ width: 1920, height: 1080 });
            expect(consoleSpy).toHaveBeenCalledWith("Escala inválida:", 15, "usando 1.0");
            
            consoleSpy.mockRestore();
        });

        test('handles zero scale', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const result = calculateCanvasSize(mockJsonFile, 0);
            
            expect(result).toEqual({ width: 1920, height: 1080 });
            expect(consoleSpy).toHaveBeenCalledWith("Escala inválida:", 0, "usando 1.0");
            
            consoleSpy.mockRestore();
        });

        test('handles null scale', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const result = calculateCanvasSize(mockJsonFile, null);
            
            expect(result).toEqual({ width: 1920, height: 1080 });
            expect(consoleSpy).toHaveBeenCalledWith("Escala inválida:", null, "usando 1.0");
            
            consoleSpy.mockRestore();
        });
    });

    /**
     * Testes para a função calculateHeatmapRadius
     * Verifica se o raio do heatmap é calculado corretamente
     */
    describe('calculateHeatmapRadius', () => {
        test('calculates radius with default base radius', () => {
            const scale = 2;
            const result = calculateHeatmapRadius(scale);
            
            expect(result).toBe(100); // 50 * 2
        });

        test('calculates radius with custom base radius', () => {
            const scale = 1.5;
            const baseRadius = 40;
            const result = calculateHeatmapRadius(scale, baseRadius);
            
            expect(result).toBe(60); // 40 * 1.5
        });

        test('enforces minimum radius', () => {
            const scale = 0.1;
            const baseRadius = 50;
            const result = calculateHeatmapRadius(scale, baseRadius);
            
            expect(result).toBe(10); // Mínimo é 10, mesmo que 50 * 0.1 = 5
        });

        test('handles zero scale', () => {
            const scale = 0;
            const result = calculateHeatmapRadius(scale);
            
            expect(result).toBe(10); // Mínimo
        });

        test('handles negative scale', () => {
            const scale = -1;
            const result = calculateHeatmapRadius(scale);
            
            expect(result).toBe(10); // Mínimo
        });

        test('calculates with small scale', () => {
            const scale = 0.3;
            const baseRadius = 50;
            const result = calculateHeatmapRadius(scale, baseRadius);
            
            expect(result).toBe(15); // 50 * 0.3 = 15, que é maior que o mínimo 10
        });

        test('calculates with large scale', () => {
            const scale = 5;
            const baseRadius = 30;
            const result = calculateHeatmapRadius(scale, baseRadius);
            
            expect(result).toBe(150); // 30 * 5
        });

        test('handles fractional results', () => {
            const scale = 1.7;
            const baseRadius = 35;
            const result = calculateHeatmapRadius(scale, baseRadius);
            
            expect(result).toBe(59.5); // 35 * 1.7 = 59.5
        });

        test('enforces minimum even with very small base radius', () => {
            const scale = 2;
            const baseRadius = 3;
            const result = calculateHeatmapRadius(scale, baseRadius);
            
            expect(result).toBe(10); // Mínimo, mesmo que 3 * 2 = 6
        });
    });
});
