/**
 * Utilitários para manipulação de coordenadas
 */

/**
 * Transforma strings de coordenadas em objetos
 * @param {string} xValues - String de valores X separados por ponto e vírgula
 * @param {string} yValues - String de valores Y separados por ponto e vírgula
 * @returns {Array} Array de objetos com coordenadas {x, y}
 */
export const transformToCoordinates = (xValues, yValues) => {
    if (!xValues || !yValues) {
        console.warn("xValues ou yValues está vazio");
        return [];
    }

    const xArray = xValues.split(";").map(Number);
    const yArray = yValues.split(";").map(Number);

    if (xArray.length !== yArray.length) {
        throw new Error("X and Y arrays must have the same length");
    }

    return xArray.map((x, index) => ({
        x: x,
        y: yArray[index],
    }));
};

/**
 * Combina coordenadas de diferentes testes
 * @param {Object} dataFiles - Dados dos arquivos
 * @param {string|number} selectedIndex - Índice do teste selecionado ou "all"
 * @returns {Array} Array de coordenadas combinadas
 */
export const combineCoordinates = (dataFiles, selectedIndex) => {
    console.log("Combinando coordenadas com selectedIndex:", selectedIndex);

    let combinedCoords = [];

    // Verificações de segurança para dados
    if (!dataFiles || !dataFiles.jsonData || !Array.isArray(dataFiles.jsonData)) {
        console.warn("Dados JSON não válidos");
        return [];
    }

    try {
        if (selectedIndex === "all") {
            // Combine todos os testes
            dataFiles.jsonData.forEach((dataItem, index) => {
                if (!dataItem) {
                    console.warn("Teste", index, "é undefined");
                    return;
                }

                if (dataItem.coordinates && Array.isArray(dataItem.coordinates)) {
                    console.log(`Adicionando ${dataItem.coordinates.length} coordenadas do teste ${index}`);
                    combinedCoords = combinedCoords.concat(dataItem.coordinates);
                } else if (dataItem.x && dataItem.y) {
                    const coords = transformToCoordinates(dataItem.x, dataItem.y);
                    console.log(`Transformando e adicionando ${coords.length} coordenadas do teste ${index}`);
                    combinedCoords = combinedCoords.concat(coords);
                } else {
                    console.warn(`Teste ${index} não tem coordenadas válidas`);
                }
            });
        } else {
            // Verifica se é um número válido
            const index = parseInt(selectedIndex, 10);

            if (isNaN(index)) {
                console.warn("selectedIndex não é um número válido:", selectedIndex);
                return [];
            }

            // Verifica se o índice está dentro dos limites
            if (index < 0 || index >= dataFiles.jsonData.length) {
                console.warn("Índice fora dos limites:", index, "para array de tamanho", dataFiles.jsonData.length);
                return [];
            }

            const dataItem = dataFiles.jsonData[index];

            if (!dataItem) {
                console.warn("Teste", index, "é undefined");
                return [];
            }

            if (dataItem.coordinates && Array.isArray(dataItem.coordinates)) {
                console.log(`Usando ${dataItem.coordinates.length} coordenadas do teste ${index}`);
                combinedCoords = dataItem.coordinates;
            } else if (dataItem.x && dataItem.y) {
                combinedCoords = transformToCoordinates(dataItem.x, dataItem.y);
            } else {
                console.warn(`Teste ${index} não tem coordenadas válidas`);
            }
        }
    } catch (error) {
        console.error("Erro ao combinar coordenadas:", error);
    }

    console.log(`Retornando ${combinedCoords.length} coordenadas combinadas`);
    return combinedCoords;
};

/**
 * Valida se as coordenadas são válidas
 * @param {Array} coords - Array de coordenadas
 * @returns {Array} Array de coordenadas válidas
 */
export const validateCoordinates = (coords) => {
    if (!Array.isArray(coords)) {
        return [];
    }

    return coords.filter(coord => {
        // Verifica se x e y são números válidos
        const isValid = coord &&
            typeof coord.x === 'number' && !isNaN(coord.x) &&
            typeof coord.y === 'number' && !isNaN(coord.y);

        if (!isValid) {
            console.warn("Coordenada inválida descartada:", coord);
        }

        return isValid;
    });
};

/**
 * Escala as coordenadas baseado em um fator de escala
 * @param {Array} coords - Array de coordenadas
 * @param {number} scale - Fator de escala
 * @returns {Array} Array de coordenadas escaladas
 */
export const scaleCoordinates = (coords, scale) => {
    if (!Array.isArray(coords) || !scale || scale <= 0) {
        return [];
    }

    return coords.map(coord => ({
        x: Math.round(coord.x * scale),
        y: Math.round(coord.y * scale),
        value: 50, // Valor padrão para heatmap
    }));
};
