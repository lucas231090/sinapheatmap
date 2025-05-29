import { useState, useRef, useEffect } from "react";
import useHeatmapLogic from "@/hooks/useHeatmapLogic";

/**
 * Hook específico para gerenciar o comportamento do vídeo de heatmap
 * Usa o hook de lógica geral e adiciona funcionalidades específicas do vídeo
 */
const useHeatmapVideoLogic = (id) => {
    // Refs necessários para o player
    const playerRef = useRef(null);
    const canvasRef = useRef(null);
    const heatmapCanvasRef = useRef(null);
    const imgRef = useRef(null);

    // Estados específicos do vídeo
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayer, setShowPlayer] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [playerKey, setPlayerKey] = useState(0);
    const [selectedTestIndex, setSelectedTestIndex] = useState("");
    const [autoSelectedTest, setAutoSelectedTest] = useState(null);

    // Constantes para o vídeo
    const FRAMES_PER_POINT = 10;

    // Usa o hook de lógica geral
    const {
        fileName,
        dataFile,
        img,
        coords,
        canvasSize,
        radiusScale,
        isLoading,
        error,
    } = useHeatmapLogic(id, selectedTestIndex || autoSelectedTest || "");

    // Handler para mudança de teste
    const handleTestSelect = (newTestIndex) => {
        setShowPlayer(false);
        setAutoSelectedTest(null); // Limpa a seleção automática quando o usuário seleciona manualmente
        setSelectedTestIndex(newTestIndex);
        return newTestIndex;
    };

    // Manipulador para iniciar o vídeo
    const handleVideoStart = () => {
        if (coords && coords.length > 0) {
            setShowPlayer(true);
        }
    };

    // Efeito para auto-selecionar teste quando há apenas um disponível
    useEffect(() => {
        if (dataFile?.jsonData?.length === 1 && !selectedTestIndex && !autoSelectedTest) {
            const autoIndex = "0"; // Seleciona o primeiro (e único) teste
            setAutoSelectedTest(autoIndex);
            // Pequeno delay para garantir que os dados estão carregados
            setTimeout(() => {
                setShowPlayer(true);
            }, 100);
        }
    }, [dataFile, selectedTestIndex, autoSelectedTest]);

    // Verifica se temos um teste selecionado (manual ou automático)
    const currentTestIndex = selectedTestIndex || autoSelectedTest;
    const hasSingleTest = dataFile?.jsonData?.length === 1;
    const shouldShowSelector = dataFile?.jsonData?.length > 1;

    // Verifica se temos dados válidos
    const hasValidData =
        coords &&
        coords.length > 0 &&
        canvasSize.width > 0 &&
        canvasSize.height > 0;

    // Parse de dimensões com fallbacks
    const width = parseInt(canvasSize.width, 10) || 1280;
    const height = parseInt(canvasSize.height, 10) || 720;

    // Calcula frames necessários
    const totalFrames = hasValidData
        ? coords.length * FRAMES_PER_POINT + 60
        : 150;

    // Prepara dados do heatmap para o componente Remotion
    const heatmapData = {
        coords: coords || [],
        radiusScale: radiusScale || 1,
        canvasSize: {
            width: width,
            height: height,
        },
    };

    // Efeito para reiniciar o player ao mudar de teste
    useEffect(() => {
        if (currentTestIndex) {
            setTimeout(() => {
                setPlayerKey((prevKey) => prevKey + 1);
                if (!showPlayer) {
                    setShowPlayer(true);
                }
            }, 100);
        }
    }, [currentTestIndex]);

    return {
        // Refs
        playerRef,
        canvasRef,
        heatmapCanvasRef,
        imgRef,

        // Estados do vídeo
        isPlaying,
        setIsPlaying,
        showPlayer,
        setShowPlayer,
        playbackSpeed,
        setPlaybackSpeed,
        playerKey,

        // Dados do heatmap
        fileName,
        dataFile,
        img,
        width,
        height,
        totalFrames,
        hasValidData,
        heatmapData,

        // Estados de controle
        isLoading,
        error,

        // Novos estados para lidar com teste único
        hasSingleTest,
        shouldShowSelector,
        currentTestIndex,
        selectedTestIndex,
        autoSelectedTest,

        // Handlers
        handleTestSelect,
        handleVideoStart,
    };
};

export default useHeatmapVideoLogic;
