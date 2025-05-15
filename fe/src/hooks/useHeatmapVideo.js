import { useState, useEffect, useRef } from "react";
import useHeatmap from "./useHeatmap";

/**
 * Hook específico para gerenciar o comportamento do vídeo de heatmap
 */
const useHeatmapVideo = (id, selectedTestIndex) => {
    // Refs necessários
    const playerRef = useRef(null);
    const canvasRef = useRef(null);
    const heatmapCanvasRef = useRef(null);
    const imgRef = useRef(null);

    // Estado para o player de vídeo
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayer, setShowPlayer] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [playerKey, setPlayerKey] = useState(0); // Para forçar remontagem do player

    // Constantes para o vídeo
    const FRAMES_PER_POINT = 10;

    // Utilizamos o hook genérico de heatmap para obter os dados
    const {
        fileName,
        dataFile,
        img,
        coords,
        canvasSize,
        radiusScale
    } = useHeatmap(
        id,
        selectedTestIndex,
        canvasRef,
        heatmapCanvasRef,
        imgRef,
        true, // heatmapCanvasVisible
        false // canvasVisible
    );

    // Handler para mudança de teste
    const handleTestSelect = (newTestIndex) => {
        // Só procede se o teste realmente estiver mudando
        if (newTestIndex !== selectedTestIndex) {
            // Esconde o player atual
            setShowPlayer(false);
            setIsPlaying(false);

            // Atualiza o índice do teste selecionado
            return newTestIndex;
        }

        return selectedTestIndex;
    };

    // Manipulador para iniciar o vídeo
    const handleVideoStart = () => {
        if (!showPlayer) {
            setShowPlayer(true);
        }

        // Usa requestAnimationFrame para início de reprodução mais suave
        requestAnimationFrame(() => {
            if (playerRef.current) {
                playerRef.current.seekTo(0);
                playerRef.current.play();
                setIsPlaying(true);
            }
        });
    };

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

    // Prepara dados do heatmap
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
        if (selectedTestIndex) {
            setTimeout(() => {
                // Incrementa a key para forçar remontagem
                setPlayerKey((prevKey) => prevKey + 1);
                // Mostra o novo player
                setShowPlayer(true);
            }, 100);
        }
    }, [selectedTestIndex]);

    return {
        playerRef,
        isPlaying,
        setIsPlaying,
        showPlayer,
        setShowPlayer,
        playbackSpeed,
        setPlaybackSpeed,
        playerKey,
        fileName,
        dataFile,
        img,
        width,
        height,
        totalFrames,
        hasValidData,
        heatmapData,
        handleTestSelect,
        handleVideoStart
    };
};

export default useHeatmapVideo;
