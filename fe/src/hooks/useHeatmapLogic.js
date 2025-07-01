import { useState, useEffect } from "react";
import useHeatmapBase from './useHeatmapBase';
import { downloadHeatMapImage } from "@/utils";

/**
 * Hook para lógica estática de heatmap
 * Usa o hook base e adiciona funcionalidades específicas da visualização estática
 */
const useHeatmapLogic = (id, selectedTestIndex = "all") => {
    // Hook base para funcionalidades compartilhadas
    const {
        // Estados de dados do hook base
        fileName,
        dataFile,
        jsonFile,
        mediaUrl: img, // Renomeando para compatibilidade
        coords,
        canvasSize,
        isLoading,
        error,
        radiusScale,
        windowSize: baseWindowSize,
        // Funções do hook base
        processCoordinates,
        reprocessData,
        setError,
    } = useHeatmapBase(id, selectedTestIndex);

    // Estados específicos da lógica estática
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    // Escuta mudanças de tamanho da janela
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Quando o tamanho da janela muda, força reprocessamento
    useEffect(() => {
        if (jsonFile && dataFile && windowSize !== baseWindowSize) {
            reprocessData();
        }
    }, [windowSize, jsonFile, dataFile, baseWindowSize, reprocessData]);

    // Função para download (delegada para utils)
    const downloadHeatMap = (canvasRefs) => {
        downloadHeatMapImage({
            ...canvasRefs,
            canvasSize,
            fileName
        });
    };

    // Função para atualizar seleção de teste
    const updateTestSelection = (newSelectedIndex) => {
        // O hook base já vai reprocessar automaticamente quando selectedTestIndex mudar
        if (jsonFile && dataFile) {
            reprocessData();
        }
    };

    return {
        // Estados de dados
        fileName,
        dataFile,
        jsonFile,
        img,
        coords,
        radiusScale,
        canvasSize,
        windowSize,

        // Estados de controle
        isLoading,
        error,

        // Funções
        downloadHeatMap,
        updateTestSelection,
        
        // Função para refetch - delegada do hook base
        refetchData: reprocessData,
    };
};

export default useHeatmapLogic;
