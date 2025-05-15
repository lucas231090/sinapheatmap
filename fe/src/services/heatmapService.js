/**
 * Serviço para processar e manipular dados de heatmap
 */

/**
 * Transforma strings de coordenadas em objetos
 * @param {string} xValues - String de valores X separados por ponto e vírgula
 * @param {string} yValues - String de valores Y separados por ponto e vírgula
 * @returns {Array} Array de objetos com coordenadas {x, y}
 */
export const transformToCoordinates = (xValues, yValues) => {
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
 * Calcula a escala responsiva com base no tamanho da janela
 * @param {Object} jsonFile - Arquivo JSON com dados
 * @param {Object} windowSize - Tamanho da janela
 * @returns {number} Escala calculada
 */
export const calculateResponsiveScale = (jsonFile, windowSize) => {
    if (!jsonFile) return 1;

    const availableWidth = windowSize.width;
    const availableHeight = windowSize.height;

    const originalWidth = jsonFile["Largura Tela"];
    const originalHeight = jsonFile["Altura Tela"];

    const widthScale = Math.round(availableWidth / originalWidth);
    const heightScale = Math.round(availableHeight / originalHeight);

    const scale = Math.min(widthScale, heightScale);

    return scale / 2;
};

/**
 * Gera um download da imagem do heatmap
 * @param {Object} params - Parâmetros para download
 */
export const downloadHeatMap = ({
    heatmapCanvasRef,
    canvasRef,
    imgRef,
    canvasSize,
    heatmapVisible,
    canvasVisible,
    fileName
}) => {
    if (!heatmapCanvasRef?.current || !imgRef?.current) {
        console.error("Algum dos refs necessários está faltando");
        return;
    }

    try {
        const overlayCanvas = heatmapCanvasRef.current.querySelector("canvas");
        const bubbleCanvas = canvasRef?.current;
        const finalCanvas = document.createElement("canvas");
        const finalContext = finalCanvas.getContext("2d");

        finalCanvas.width = canvasSize.width;
        finalCanvas.height = canvasSize.height;

        // Desenha a imagem de fundo
        if (imgRef.current) {
            finalContext.drawImage(
                imgRef.current,
                0,
                0,
                canvasSize.width,
                canvasSize.height
            );
        }

        // Desenha o heatmap
        if (heatmapVisible) {
            finalContext.drawImage(overlayCanvas, 0, 0);
        }

        // Desenha as bolhas se estiverem visíveis
        if (canvasVisible) {
            finalContext.drawImage(bubbleCanvas, 0, 0);
        }

        const dataURL = finalCanvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `Heatmap-${fileName || "download"}.png`;
        link.click();
    } catch (error) {
        console.error("Erro ao fazer download:", error);
    }
};
