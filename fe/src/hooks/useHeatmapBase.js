import { useState, useEffect, useRef } from "react";
import { getFileById, getFileMedia } from "@/services/fileService";
import {
    combineCoordinates,
    validateCoordinates,
    scaleCoordinates,
    calculateResponsiveScale,
    calculateCanvasSize
} from "@/utils";

/**
 * Hook base para funcionalidades compartilhadas de heatmap
 * Contém a lógica comum para buscar dados, processar coordenadas e gerenciar estados
 * 
 * @param {string} id - ID do arquivo de teste
 * @param {string} selectedTestIndex - Índice do teste selecionado ("all" ou número)
 * @param {Object} options - Opções específicas do hook
 * @param {boolean} options.useResponsiveCanvas - Se deve usar canvas responsivo (padrão: true)
 * @param {Object} options.fixedCanvasSize - Tamanho fixo do canvas para gravação de vídeo
 */
const useHeatmapBase = (id, selectedTestIndex = "all", options = {}) => {
    const {
        useResponsiveCanvas = true,
        fixedCanvasSize = { width: 800, height: 450 }
    } = options;

    // Estados principais compartilhados
    const [fileName, setFileName] = useState("");
    const [dataFile, setDataFile] = useState(null);
    const [jsonFile, setJsonFile] = useState(null);
    const [mediaUrl, setMediaUrl] = useState(null);
    const [mediaType, setMediaType] = useState(0); // 0 = imagem, 1 = video
    
    // Estados do heatmap
    const [coords, setCoords] = useState([]);
    const [canvasSize, setCanvasSize] = useState(fixedCanvasSize);
    const [radiusScale, setRadiusScale] = useState(1);
    
    // Estados de controle
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Estado de janela para responsividade
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    // Cache para imagem (para reutilização)
    const imageRef = useRef(null);

    // Carrega dados quando ID ou seleção muda
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

    // Processa coordenadas quando dados mudam
    useEffect(() => {
        if (jsonFile && dataFile) {
            processCoordinates();
        }
    }, [jsonFile, dataFile, selectedTestIndex, windowSize]);

    /**
     * Busca dados do backend
     */
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getFileById(id);
            
            if (!data) {
                throw new Error("Dados não encontrados");
            }

            setFileName(data.filename);
            setDataFile(data);
            setMediaType(data.mediaType || 0);

            // Define o arquivo JSON
            if (data.jsonData?.length > 0) {
                setJsonFile(data.jsonData[0]);
            } else if (data.length > 0) {
                setJsonFile(data);
            } else {
                console.warn('⚠️ No JSON data found');
            }

            // Carrega mídia se disponível
            if (data.mediaPath) {
                const mediaPath = data.mediaPath;
                const mediaName = mediaPath.split("/").pop();
                try {
                    const mediaUrlResult = await getFileMedia(mediaName);
                    setMediaUrl(mediaUrlResult);
                    
                    // Se for imagem, pré-carrega na referência
                    if (data.mediaType === 0) {
                        const img = new Image();
                        img.onload = () => {
                            imageRef.current = img;
                        };
                        img.onerror = () => {
                            console.error('❌ Error preloading image');
                        };
                        img.crossOrigin = 'anonymous';
                        img.src = mediaUrlResult;
                    }
                } catch (mediaError) {
                    console.error("❌ Erro ao carregar mídia:", mediaError);
                    setError(`Erro ao carregar mídia: ${mediaName} - ${mediaError.message}`);
                }
            } else {
                console.warn("⚠️ Nenhuma mídia encontrada para este teste");
            }
        } catch (err) {
            setError(err.message);
            console.error("Erro ao buscar dados:", err);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Processa coordenadas do teste
     */
    const processCoordinates = () => {
        if (!jsonFile || !dataFile) return;

        try {
            // Calcula escala responsiva ou usa tamanho fixo
            let scale, calculatedCanvasSize;
            
            if (windowSize.width > 0 && useResponsiveCanvas) {
                // Para visualização estática - usa escala responsiva
                scale = calculateResponsiveScale(jsonFile, windowSize);
                calculatedCanvasSize = calculateCanvasSize(jsonFile, scale);
            } else {
                // Para gravação de vídeo - usa tamanho fixo
                const screenWidth = parseInt(jsonFile["Largura Tela"]) || 1920;
                const screenHeight = parseInt(jsonFile["Altura Tela"]) || 1080;
                
                scale = Math.min(
                    canvasSize.width / screenWidth,
                    canvasSize.height / screenHeight
                );
                calculatedCanvasSize = canvasSize;
            }

            // Combina todas as coordenadas baseado na seleção
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
            setCoords(scaledCoords);
            setCanvasSize(calculatedCanvasSize);
            setRadiusScale(scale);

        } catch (error) {
            console.error("Erro ao processar coordenadas:", error);
            setCoords([]);
            setError("Erro ao processar coordenadas do teste");
        }
    };

    /**
     * Calcula duração baseada nas coordenadas (para vídeo)
     */
    const calculateDuration = (coordinatesPerSecond = 10) => {
        return coords.length / coordinatesPerSecond;
    };

    /**
     * Função para reprocessar dados (útil quando muda seleção)
     */
    const reprocessData = () => {
        if (jsonFile && dataFile) {
            processCoordinates();
        }
    };

    // Cleanup de URLs quando componente desmonta
    useEffect(() => {
        return () => {
            // Só limpar blob URLs, não URLs diretas
            if (mediaUrl && mediaUrl.startsWith('blob:')) {
                URL.revokeObjectURL(mediaUrl);
            }
        };
    }, [mediaUrl]);

    return {
        // Estados de dados
        fileName,
        dataFile,
        jsonFile,
        mediaUrl,
        mediaType,
        coords,
        canvasSize,
        radiusScale,
        windowSize,
        
        // Estados de controle
        isLoading,
        error,
        
        // Refs
        imageRef,
        
        // Funções
        fetchData,
        processCoordinates,
        reprocessData,
        calculateDuration,
        
        // Setters para casos específicos
        setCanvasSize,
        setError,
    };
};

export default useHeatmapBase;
