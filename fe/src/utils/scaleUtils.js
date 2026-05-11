/**
 * Utilitários para cálculos responsivos
 */

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

    if (!originalWidth || !originalHeight) {
        console.warn("Dimensões originais não encontradas no JSON");
        return 1;
    }

    const widthScale = availableWidth / originalWidth;
    const heightScale = availableHeight / originalHeight;

    // Usa a menor escala para manter proporção
    const scale = Math.min(widthScale, heightScale, 1);

    // Garante um valor mínimo e máximo para a escala
    return Math.max(0.1, Math.min(scale, 2));
};

/**
 * Calcula as dimensões do canvas baseado nos dados e escala
 * @param {Object} jsonFile - Arquivo JSON com dados
 * @param {number} scale - Fator de escala
 * @returns {Object} Objeto com width e height
 */
export const calculateCanvasSize = (jsonFile, scale = 1) => {
    if (!jsonFile) {
        return { width: 1280, height: 720 }; // Valores padrão
    }

    const originalWidth = parseFloat(jsonFile["Largura Tela"]) || 1280;
    const originalHeight = parseFloat(jsonFile["Altura Tela"]) || 720;

    // Verifica se scale é um número razoável
    if (isNaN(scale) || scale <= 0 || scale > 10) {
        console.warn("Escala inválida:", scale, "usando 1.0");
        scale = 1.0;
    }

    return {
        width: Math.round(originalWidth * scale),
        height: Math.round(originalHeight * scale)
    };
};

/**
 * Calcula o raio do heatmap baseado na escala
 * @param {number} scale - Fator de escala
 * @param {number} baseRadius - Raio base (padrão: 50)
 * @returns {number} Raio calculado
 */
export const calculateHeatmapRadius = (scale, baseRadius = 50) => {
    return Math.max(10, baseRadius * scale);
};
