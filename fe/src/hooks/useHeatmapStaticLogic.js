import { useState, useRef } from "react";
import useHeatmapLogic from "@/hooks/useHeatmapLogic";

/**
 * Hook específico para gerenciar a visualização estática do heatmap
 * Usa o hook de lógica geral e adiciona funcionalidades específicas da visualização estática
 */
const useHeatmapStaticLogic = (id) => {
    // Refs necessários para a visualização estática
    const canvasRef = useRef(null);
    const heatmapCanvasRef = useRef(null);
    const imgRef = useRef(null);

    // Estados específicos da visualização estática
    const [canvasVisible, setCanvasVisible] = useState(false);
    const [heatmapCanvasVisible, setHeatmapCanvasVisible] = useState(true);
    const [selectedTestIndex, setSelectedTestIndex] = useState("all");

    // Usa o hook de lógica geral
    const heatmapLogic = useHeatmapLogic(id, selectedTestIndex);

    // Função para download que inclui as referências necessárias
    const downloadHeatMap = () => {
        heatmapLogic.downloadHeatMap({
            heatmapCanvasRef,
            canvasRef,
            imgRef,
            heatmapVisible: heatmapCanvasVisible,
            canvasVisible: canvasVisible,
        });
    };

    return {
        // Refs específicos
        canvasRef,
        heatmapCanvasRef,
        imgRef,

        // Estados de visibilidade
        canvasVisible,
        setCanvasVisible,
        heatmapCanvasVisible,
        setHeatmapCanvasVisible,

        // Estados de seleção
        selectedTestIndex,
        setSelectedTestIndex,

        // Dados do heatmap (delegados)
        ...heatmapLogic,

        // Função de download customizada
        downloadHeatMap,
    };
};

export default useHeatmapStaticLogic;
