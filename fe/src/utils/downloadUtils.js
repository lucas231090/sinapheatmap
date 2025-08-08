/**
 * Utilitários para download de arquivos
 */

/**
 * Gera um download da imagem do heatmap
 * @param {Object} params - Parâmetros para download
 */
export const downloadHeatMapImage = ({
    heatmapCanvasRef,
    canvasRef,
    imgRef,
    canvasSize,
    heatmapVisible,
    canvasVisible,
    fileName
}) => {
    if (!heatmapCanvasRef?.current || !imgRef?.current || !canvasSize?.width) {
        console.error("Referências necessárias não encontradas para download");
        return;
    }

    try {
        // Pega o canvas do heatmap
        const overlayCanvas = document.querySelectorAll('.heatmap-canvas')[0];

        if (!overlayCanvas) {
            console.error("Canvas do heatmap não encontrado");
            return;
        }

        // Cria um novo canvas para combinar imagem e heatmap
        const finalCanvas = document.createElement('canvas');
        const finalContext = finalCanvas.getContext('2d');

        // Define as dimensões do canvas final
        finalCanvas.width = canvasSize.width;
        finalCanvas.height = canvasSize.height;

        // Desenha a imagem de fundo
        if (imgRef.current && heatmapVisible) {
            finalContext.drawImage(imgRef.current, 0, 0, canvasSize.width, canvasSize.height);
        }

        // Desenha o heatmap por cima
        if (overlayCanvas && heatmapVisible) {
            finalContext.drawImage(overlayCanvas, 0, 0);
        }

        // Desenha o canvas de bolhas se estiver visível
        if (canvasRef?.current && canvasVisible) {
            finalContext.drawImage(canvasRef.current, 0, 0);
        }

        // Gera a URL de dados da imagem
        const dataURL = finalCanvas.toDataURL('image/png');

        // Cria um link de download
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `Heatmap-${fileName || 'export'}.png`;

        // Adiciona o link ao DOM temporariamente e clica nele
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Erro ao gerar download do heatmap:", error);
    }
};

/**
 * Gera um download de dados JSON
 * @param {Object} data - Dados para download
 * @param {string} fileName - Nome do arquivo
 */
export const downloadJSON = (data, fileName) => {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Erro ao gerar download JSON:", error);
    }
};
