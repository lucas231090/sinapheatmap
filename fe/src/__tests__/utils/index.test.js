/**
 * Testes unitários para o índice de utilitários
 * Verifica se todas as funções são exportadas corretamente
 */
import * as utils from '@/utils/index';

describe('utils/index', () => {
    /**
     * Testes de exportação dos utilitários de coordenadas
     */
    describe('coordinateUtils exports', () => {
        test('exports transformToCoordinates function', () => {
            expect(typeof utils.transformToCoordinates).toBe('function');
        });

        test('exports combineCoordinates function', () => {
            expect(typeof utils.combineCoordinates).toBe('function');
        });

        test('exports validateCoordinates function', () => {
            expect(typeof utils.validateCoordinates).toBe('function');
        });

        test('exports scaleCoordinates function', () => {
            expect(typeof utils.scaleCoordinates).toBe('function');
        });
    });

    /**
     * Testes de exportação dos utilitários de escala
     */
    describe('scaleUtils exports', () => {
        test('exports calculateResponsiveScale function', () => {
            expect(typeof utils.calculateResponsiveScale).toBe('function');
        });

        test('exports calculateCanvasSize function', () => {
            expect(typeof utils.calculateCanvasSize).toBe('function');
        });

        test('exports calculateHeatmapRadius function', () => {
            expect(typeof utils.calculateHeatmapRadius).toBe('function');
        });
    });

    /**
     * Testes de exportação dos utilitários de download
     */
    describe('downloadUtils exports', () => {
        test('exports downloadHeatMapImage function', () => {
            expect(typeof utils.downloadHeatMapImage).toBe('function');
        });

        test('exports downloadJSON function', () => {
            expect(typeof utils.downloadJSON).toBe('function');
        });
    });

    /**
     * Teste de integração básica
     */
    describe('Integration', () => {
        test('all exported functions are callable', () => {
            // Testa se as funções podem ser chamadas sem erro de referência
            expect(() => {
                // Não executamos, apenas verificamos se são funções válidas
                const functions = [
                    utils.transformToCoordinates,
                    utils.combineCoordinates,
                    utils.validateCoordinates,
                    utils.scaleCoordinates,
                    utils.calculateResponsiveScale,
                    utils.calculateCanvasSize,
                    utils.calculateHeatmapRadius,
                    utils.downloadHeatMapImage,
                    utils.downloadJSON
                ];

                functions.forEach(fn => {
                    expect(typeof fn).toBe('function');
                });
            }).not.toThrow();
        });

        test('exports expected number of functions', () => {
            const exportedKeys = Object.keys(utils);
            const expectedFunctionCount = 9; // Total de funções exportadas
            
            expect(exportedKeys.length).toBe(expectedFunctionCount);
        });

        test('does not export unexpected items', () => {
            const exportedKeys = Object.keys(utils);
            const expectedFunctions = [
                'transformToCoordinates',
                'combineCoordinates', 
                'validateCoordinates',
                'scaleCoordinates',
                'calculateResponsiveScale',
                'calculateCanvasSize',
                'calculateHeatmapRadius',
                'downloadHeatMapImage',
                'downloadJSON'
            ];

            expectedFunctions.forEach(functionName => {
                expect(exportedKeys).toContain(functionName);
            });

            // Verifica se não há exportações extras não esperadas
            exportedKeys.forEach(key => {
                expect(expectedFunctions).toContain(key);
            });
        });
    });
});
