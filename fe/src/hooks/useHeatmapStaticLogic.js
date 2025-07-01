import { useState, useRef } from "react";
import useHeatmapBase from "@/hooks/useHeatmapBase";
import { downloadHeatMapImage } from "@/utils";

/**
 * Hook específico para gerenciar a visualização estática do heatmap
 * Usa o hook base e adiciona funcionalidades específicas da visualização estática
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

    // Usa o hook base diretamente
    const {
        // Estados de dados
        fileName,
        dataFile,
        jsonFile,
        mediaUrl: img,
        coords,
        canvasSize,
        radiusScale,
        windowSize,
        
        // Estados de controle
        isLoading,
        error,
        
        // Funções
        reprocessData,
    } = useHeatmapBase(id, selectedTestIndex);

    // Função para download que inclui as referências necessárias
    const downloadHeatMap = () => {
        downloadHeatMapImage({
            heatmapCanvasRef,
            canvasRef,
            imgRef,
            heatmapVisible: heatmapCanvasVisible,
            canvasVisible: canvasVisible,
            canvasSize,
            fileName
        });
    };

    // Função para atualizar seleção de teste
    const updateTestSelection = (newSelectedIndex) => {
        setSelectedTestIndex(newSelectedIndex);
        // O hook base já reprocessará automaticamente quando selectedTestIndex mudar
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

        // Estados de dados (do hook base)
        fileName,
        dataFile,
        jsonFile,
        img,
        coords,
        radiusScale,
        canvasSize,
        windowSize,

        // Estados de controle (do hook base)
        isLoading,
        error,

        // Funções
        downloadHeatMap,
        updateTestSelection,
        refetchData: reprocessData,
    };
};

export default useHeatmapStaticLogic;
