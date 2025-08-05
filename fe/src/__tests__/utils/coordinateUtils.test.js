/**
 * Testes unitários para utilitários de manipulação de coordenadas
 * Verifica todas as funções de transformação e validação de coordenadas
 */
import {
    transformToCoordinates,
    combineCoordinates,
    validateCoordinates,
    scaleCoordinates
} from '@/utils/coordinateUtils';

describe('coordinateUtils', () => {
    /**
     * Testes para a função transformToCoordinates
     * Verifica se strings de coordenadas são transformadas corretamente em objetos
     */
    describe('transformToCoordinates', () => {
        test('transforms valid coordinate strings to objects', () => {
            const xValues = "100;200;300";
            const yValues = "50;150;250";
            
            const result = transformToCoordinates(xValues, yValues);
            
            expect(result).toEqual([
                { x: 100, y: 50 },
                { x: 200, y: 150 },
                { x: 300, y: 250 }
            ]);
        });

        test('handles single coordinate pair', () => {
            const xValues = "100";
            const yValues = "50";
            
            const result = transformToCoordinates(xValues, yValues);
            
            expect(result).toEqual([{ x: 100, y: 50 }]);
        });

        test('returns empty array when xValues is empty or null', () => {
            expect(transformToCoordinates("", "50;100")).toEqual([]);
            expect(transformToCoordinates(null, "50;100")).toEqual([]);
            expect(transformToCoordinates(undefined, "50;100")).toEqual([]);
        });

        test('returns empty array when yValues is empty or null', () => {
            expect(transformToCoordinates("50;100", "")).toEqual([]);
            expect(transformToCoordinates("50;100", null)).toEqual([]);
            expect(transformToCoordinates("50;100", undefined)).toEqual([]);
        });

        test('throws error when arrays have different lengths', () => {
            const xValues = "100;200;300";
            const yValues = "50;150"; // Um elemento a menos
            
            expect(() => transformToCoordinates(xValues, yValues))
                .toThrow("X and Y arrays must have the same length");
        });

        test('handles string numbers correctly', () => {
            const xValues = "100.5;200.7";
            const yValues = "50.3;150.9";
            
            const result = transformToCoordinates(xValues, yValues);
            
            expect(result).toEqual([
                { x: 100.5, y: 50.3 },
                { x: 200.7, y: 150.9 }
            ]);
        });
    });

    /**
     * Testes para a função combineCoordinates
     * Verifica se coordenadas de diferentes testes são combinadas corretamente
     */
    describe('combineCoordinates', () => {
        const mockDataFiles = {
            jsonData: [
                {
                    coordinates: [{ x: 100, y: 50 }, { x: 200, y: 150 }]
                },
                {
                    x: "300;400",
                    y: "250;350"
                },
                {
                    coordinates: [{ x: 500, y: 450 }]
                }
            ]
        };

        test('combines all coordinates when selectedIndex is "all"', () => {
            const result = combineCoordinates(mockDataFiles, "all");
            
            expect(result).toEqual([
                { x: 100, y: 50 },
                { x: 200, y: 150 },
                { x: 300, y: 250 },
                { x: 400, y: 350 },
                { x: 500, y: 450 }
            ]);
        });

        test('returns coordinates for specific index', () => {
            const result = combineCoordinates(mockDataFiles, "0");
            
            expect(result).toEqual([
                { x: 100, y: 50 },
                { x: 200, y: 150 }
            ]);
        });

        test('transforms x,y strings for specific index', () => {
            const result = combineCoordinates(mockDataFiles, "1");
            
            expect(result).toEqual([
                { x: 300, y: 250 },
                { x: 400, y: 350 }
            ]);
        });

        test('returns empty array for invalid dataFiles', () => {
            expect(combineCoordinates(null, "all")).toEqual([]);
            expect(combineCoordinates({}, "all")).toEqual([]);
            expect(combineCoordinates({ jsonData: null }, "all")).toEqual([]);
        });

        test('returns empty array for invalid index', () => {
            expect(combineCoordinates(mockDataFiles, "invalid")).toEqual([]);
            expect(combineCoordinates(mockDataFiles, "-1")).toEqual([]);
            expect(combineCoordinates(mockDataFiles, "99")).toEqual([]);
        });

        test('handles undefined data items gracefully', () => {
            const dataWithUndefined = {
                jsonData: [
                    { coordinates: [{ x: 100, y: 50 }] },
                    undefined,
                    { coordinates: [{ x: 200, y: 150 }] }
                ]
            };
            
            const result = combineCoordinates(dataWithUndefined, "all");
            
            expect(result).toEqual([
                { x: 100, y: 50 },
                { x: 200, y: 150 }
            ]);
        });

        test('handles data items without valid coordinates', () => {
            const dataWithoutCoords = {
                jsonData: [
                    { coordinates: [{ x: 100, y: 50 }] },
                    { someOtherField: "value" },
                    { coordinates: [{ x: 200, y: 150 }] }
                ]
            };
            
            const result = combineCoordinates(dataWithoutCoords, "all");
            
            expect(result).toEqual([
                { x: 100, y: 50 },
                { x: 200, y: 150 }
            ]);
        });
    });

    /**
     * Testes para a função validateCoordinates
     * Verifica se coordenadas inválidas são filtradas
     */
    describe('validateCoordinates', () => {
        test('filters out invalid coordinates', () => {
            const coords = [
                { x: 100, y: 50 },
                { x: "invalid", y: 150 },
                { x: 200, y: null },
                { x: 300, y: 250 },
                null,
                { x: NaN, y: 350 },
                { x: 400, y: 450 }
            ];
            
            const result = validateCoordinates(coords);
            
            expect(result).toEqual([
                { x: 100, y: 50 },
                { x: 300, y: 250 },
                { x: 400, y: 450 }
            ]);
        });

        test('returns empty array for non-array input', () => {
            expect(validateCoordinates(null)).toEqual([]);
            expect(validateCoordinates(undefined)).toEqual([]);
            expect(validateCoordinates("not an array")).toEqual([]);
            expect(validateCoordinates({})).toEqual([]);
        });

        test('returns empty array when all coordinates are invalid', () => {
            const invalidCoords = [
                { x: "invalid", y: "invalid" },
                { x: null, y: null },
                null,
                undefined
            ];
            
            const result = validateCoordinates(invalidCoords);
            
            expect(result).toEqual([]);
        });

        test('handles coordinates with additional properties', () => {
            const coords = [
                { x: 100, y: 50, value: 10, timestamp: 123456 },
                { x: 200, y: 150, extraProp: "test" }
            ];
            
            const result = validateCoordinates(coords);
            
            expect(result).toEqual([
                { x: 100, y: 50, value: 10, timestamp: 123456 },
                { x: 200, y: 150, extraProp: "test" }
            ]);
        });
    });

    /**
     * Testes para a função scaleCoordinates
     * Verifica se coordenadas são escaladas corretamente
     */
    describe('scaleCoordinates', () => {
        test('scales coordinates correctly', () => {
            const coords = [
                { x: 100, y: 50 },
                { x: 200, y: 150 }
            ];
            const scale = 2;
            
            const result = scaleCoordinates(coords, scale);
            
            expect(result).toEqual([
                { x: 200, y: 100, value: 50 },
                { x: 400, y: 300, value: 50 }
            ]);
        });

        test('scales with decimal values', () => {
            const coords = [{ x: 100, y: 50 }];
            const scale = 1.5;
            
            const result = scaleCoordinates(coords, scale);
            
            expect(result).toEqual([
                { x: 150, y: 75, value: 50 }
            ]);
        });

        test('scales with fractional scale', () => {
            const coords = [{ x: 100, y: 50 }];
            const scale = 0.5;
            
            const result = scaleCoordinates(coords, scale);
            
            expect(result).toEqual([
                { x: 50, y: 25, value: 50 }
            ]);
        });

        test('returns empty array for invalid inputs', () => {
            expect(scaleCoordinates(null, 2)).toEqual([]);
            expect(scaleCoordinates([], 2)).toEqual([]);
            expect(scaleCoordinates([{ x: 100, y: 50 }], 0)).toEqual([]);
            expect(scaleCoordinates([{ x: 100, y: 50 }], -1)).toEqual([]);
            expect(scaleCoordinates([{ x: 100, y: 50 }], null)).toEqual([]);
        });

        test('rounds coordinates to integers', () => {
            const coords = [{ x: 100.7, y: 50.3 }];
            const scale = 1.1;
            
            const result = scaleCoordinates(coords, scale);
            
            expect(result).toEqual([
                { x: 111, y: 55, value: 50 }
            ]);
        });

        test('preserves existing properties and adds value', () => {
            const coords = [
                { x: 100, y: 50, timestamp: 123456 }
            ];
            const scale = 2;
            
            const result = scaleCoordinates(coords, scale);
            
            expect(result).toEqual([
                { x: 200, y: 100, value: 50 }
            ]);
        });
    });
});
