import { useState, useEffect } from "react";
import { getFileById, getFileMedia } from "@/services/fileService";
import {
    combineCoordinates,
    validateCoordinates,
    scaleCoordinates,
    calculateResponsiveScale,
    calculateCanvasSize,
    downloadHeatMapImage
} from "@/utils";

/**
 * Hook centralizado para gerenciar dados de heatmap
 * Foca apenas na lógica de programação, sem manipulação de DOM
 */
const useHeatmapLogic = (id, selectedTestIndex) => {
    // Estados principais
    const [fileName, setFileName] = useState();
    const [dataFile, setDataFile] = useState();
    const [jsonFile, setJsonFile] = useState();
    const [img, setImg] = useState(null);
    const [coords, setCoords] = useState([]);
    const [radiusScale, setRadiusScale] = useState(1);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    // Carrega dados iniciais quando ID muda
    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

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

    // Processa dados quando mudarem
    useEffect(() => {
        if (jsonFile && dataFile) {
            processHeatmapData();
        }
    }, [jsonFile, selectedTestIndex, windowSize, dataFile]);

    // Função para buscar dados do backend
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getFileById(id);
            setFileName(data.filename);

            if (!data) {
                throw new Error("Dados não encontrados");
            }

            setDataFile(data);

            // Define o arquivo JSON
            if (data.jsonData?.length > 0) {
                setJsonFile(data.jsonData[0]);
            } else if (data.length > 0) {
                setJsonFile(data);
            }

            // Carrega mídia se disponível
            if (data.mediaPath) {
                const mediaPath = data.mediaPath;
                const imgName = mediaPath.split("/").pop();
                try {
                    const imageUrl = await getFileMedia(imgName);
                    setImg(imageUrl);
                } catch (mediaError) {
                    console.warn("Erro ao carregar mídia:", mediaError);
                }
            }
        } catch (err) {
            setError(err.message);
            console.error("Erro ao buscar dados:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Processa dados do heatmap
    const processHeatmapData = () => {
        if (!jsonFile || !dataFile) return;

        try {
            // Calcula escala responsiva
            const scale = calculateResponsiveScale(jsonFile, windowSize);

            // Calcula tamanho do canvas
            const canvasSize = calculateCanvasSize(jsonFile, scale);

            // Combina coordenadas baseado na seleção
            const allCoords = combineCoordinates(dataFile, selectedTestIndex);

            // Valida coordenadas
            const validCoords = validateCoordinates(allCoords);

            if (validCoords.length === 0) {
                console.warn("Nenhuma coordenada válida disponível");
                setCoords([]);
                return;
            }

            // Escala coordenadas
            const scaledCoords = scaleCoordinates(validCoords, scale);

            // Atualiza estados
            setCanvasSize(canvasSize);
            setRadiusScale(scale);
            setCoords(scaledCoords);

        } catch (error) {
            console.error("Erro ao processar dados do heatmap:", error);
            setCoords([]);
            setError("Erro ao processar dados do heatmap");
        }
    };

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
        // Força reprocessamento dos dados
        if (jsonFile && dataFile) {
            processHeatmapData();
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
        refetchData: fetchData,
    };
};

export default useHeatmapLogic;
