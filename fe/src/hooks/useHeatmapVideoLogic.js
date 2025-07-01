import { useState, useEffect, useRef } from "react";
import { getFileById, getFileMedia } from "@/services/fileService";
import h337 from '@mars3d/heatmap.js';
import {
    combineCoordinates,
    validateCoordinates,
    scaleCoordinates,
    calculateResponsiveScale,
    calculateCanvasSize
} from "@/utils";

/**
 * Hook específico para gerenciar a lógica do HeatmapVideo
 * Integra com os dados reais do backend e gerencia a gravação de vídeo
 */
const useHeatmapVideoLogic = (id) => {
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const heatmapContainerRef = useRef(null);
    const heatmapInstance = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);
    const imageRef = useRef(null); // Para cache da imagem

    // Estados principais
    const [fileName, setFileName] = useState("");
    const [dataFile, setDataFile] = useState(null);
    const [jsonFile, setJsonFile] = useState(null);
    const [mediaUrl, setMediaUrl] = useState(null);
    const [mediaType, setMediaType] = useState(0); // 0 = imagem, 1 = video
    
    // Estados de gravação
    const [isRecording, setIsRecording] = useState(false);
    const [downloadLink, setDownloadLink] = useState(null);
    
    // Estados do heatmap
    const [heatmapData, setHeatmapData] = useState([]);
    const [coords, setCoords] = useState([]);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });
    
    // Estados de tempo/progresso
    const [videoDuration, setVideoDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalCoordinates, setTotalCoordinates] = useState(0);
    const [currentCoordinateIndex, setCurrentCoordinateIndex] = useState(0);
    
    // Estados de controle
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Configurações do heatmap
    const fps = 30; // FPS mais realista para coordenadas
    const coordinatesPerSecond = 10; // Quantas coordenadas por segundo mostrar

    // Carrega dados quando ID muda
    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    // Processa coordenadas quando dados mudam
    useEffect(() => {
        if (jsonFile && dataFile) {
            processCoordinates();
        }
    }, [jsonFile, dataFile]);

    /**
     * Busca dados do backend
     */
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getFileById(id);
            
            setFileName(data.filename);
            setDataFile(data);
            setMediaType(data.mediaType);

            // Define o arquivo JSON
            if (data.jsonData?.length > 0) {
                setJsonFile(data.jsonData[0]);
            } else {
                console.warn('⚠️ No JSON data found');
            }

            // Carrega mídia se disponível
            if (data.mediaPath) {
                const mediaPath = data.mediaPath;
                const mediaName = mediaPath.split("/").pop();
                try {
                    const mediaUrl = await getFileMedia(mediaName);
                    setMediaUrl(mediaUrl);
                    
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
                        img.src = mediaUrl;
                    }
                } catch (mediaError) {
                    console.error("❌ Erro ao carregar mídia:", mediaError);
                    setError(`Erro ao carregar mídia: ${mediaName} - ${mediaError.message}`);
                }
            } else {
                console.warn("⚠️ Nenhuma mídia encontrada para este teste");
                setError("Nenhuma mídia encontrada para este teste");
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
            // Combina todas as coordenadas (todos os testes)
            const allCoords = combineCoordinates(dataFile, "all");
            
            // Valida coordenadas
            const validCoords = validateCoordinates(allCoords);

            if (validCoords.length === 0) {
                console.warn("Nenhuma coordenada válida disponível");
                setCoords([]);
                return;
            }

            // Calcula escala baseada no tamanho da tela original
            const screenWidth = parseInt(jsonFile["Largura Tela"]) || 1920;
            const screenHeight = parseInt(jsonFile["Altura Tela"]) || 1080;
            
            const scale = Math.min(
                canvasSize.width / screenWidth,
                canvasSize.height / screenHeight
            );

            // Escala coordenadas
            const scaledCoords = scaleCoordinates(validCoords, scale);

            setCoords(scaledCoords);
            setTotalCoordinates(scaledCoords.length);
            
            // Calcula duração baseada nas coordenadas
            const duration = scaledCoords.length / coordinatesPerSecond;
            setVideoDuration(duration);

        } catch (error) {
            console.error("Erro ao processar coordenadas:", error);
            setCoords([]);
            setError("Erro ao processar coordenadas do teste");
        }
    };

    /**
     * Adiciona ponto do heatmap baseado nas coordenadas reais
     */
    const addHeatmapPoint = (timeElapsed) => {
        if (coords.length === 0) return;

        // Calcula qual coordenada mostrar baseado no tempo
        const coordinateIndex = Math.floor(timeElapsed * coordinatesPerSecond);
        
        if (coordinateIndex >= coords.length) return;

        const coordinate = coords[coordinateIndex];
        
        if (coordinate && coordinate.x !== undefined && coordinate.y !== undefined) {
            const newPoint = {
                x: Math.round(coordinate.x),
                y: Math.round(coordinate.y),
                value: 100 // Valor fixo para coordenadas de eye-tracking
            };

            setHeatmapData((prevData) => [...prevData, newPoint]);
            setCurrentCoordinateIndex(coordinateIndex);
        }
    };

    /**
     * Função de desenho do frame
     */
    const drawFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!canvas) {
            console.warn('⚠️ Canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('⚠️ Canvas context not available');
            return;
        }
        
        // Limpa canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenha mídia (vídeo ou imagem)
        if (mediaType === 1 && video && !video.paused && !video.ended) {
            // É um vídeo em reprodução
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else if (mediaType === 0) {
            // É uma imagem - usa referência em cache
            if (imageRef.current) {
                ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
            } else if (mediaUrl) {
                // Primeira vez - carrega a imagem
                const img = new Image();
                img.onload = () => {
                    imageRef.current = img;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Desenha heatmap após carregar imagem
                    const overlayCanvas = document.querySelector('.heatmap-canvas');
                    if (overlayCanvas) {
                        ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
                    }
                };
                img.crossOrigin = 'anonymous';
                img.src = mediaUrl;
                return; // Sai da função para evitar desenhar heatmap antes da imagem
            }
        }

        // Desenha overlay do heatmap
        const overlayCanvas = document.querySelector('.heatmap-canvas');
        if (overlayCanvas) {
            ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
        }

        // Continua o loop de desenho se estiver gravando
        if (isRecording) {
            requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Atualiza heatmap baseado no tempo
     */
    const updateHeatmapBasedOnTime = () => {
        if (mediaType === 1) {
            // Para vídeos, usa o currentTime do vídeo
            const video = videoRef.current;
            if (video) {
                const videoCurrentTime = video.currentTime;
                setCurrentTime(videoCurrentTime);
                addHeatmapPoint(videoCurrentTime);
            }
        }
        // Para imagens, o tempo é controlado pelo simulateImagePlayback
    };

    /**
     * Inicia gravação
     */
    const startRecording = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error('❌ Canvas not found for recording');
            return;
        }

        // Verificar se o canvas tem conteúdo
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some(pixel => pixel !== 0);
        
        if (!hasContent) {
            console.warn('⚠️ Canvas appears to be empty, drawing initial frame...');
            // Desenha frame inicial se canvas estiver vazio
            drawFrame();
        }

        const stream = canvas.captureStream(fps);
        // Verificar se o browser suporta o formato
        let mimeType = '';
        const supportedTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8', 
            'video/webm',
            'video/mp4'
        ];
        
        for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                break;
            }
        }
        
        if (!mimeType) {
            console.warn('⚠️ No supported MIME type found, using default');
        }
        
        const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const totalSize = recordedChunks.current.reduce((sum, chunk) => sum + chunk.size, 0);
            
            if (totalSize === 0) {
                console.warn('⚠️ No data recorded, cannot create blob');
                setError('Nenhum dado foi gravado');
                return;
            }
            
            const blob = new Blob(recordedChunks.current, { 
                type: mimeType || 'video/webm' 
            });
                        
            const url = URL.createObjectURL(blob);
            
            // Blob criado com sucesso, definir link de download
            setDownloadLink(url);
            
            recordedChunks.current = [];
        };

        mediaRecorder.onerror = (event) => {
            console.error('❌ MediaRecorder error:', event.error);
            setError(`Erro na gravação: ${event.error.message}`);
        };

        mediaRecorder.start(1000); // Gravar em chunks de 1 segundo
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
    };

    /**
     * Para gravação
     */
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    /**
     * Inicia reprodução e gravação
     */
    const handlePlayClick = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!canvas || !heatmapContainerRef.current) {
            setError("Elementos do canvas não encontrados");
            return;
        }

        if (!mediaUrl) {
            setError("Mídia não carregada");
            return;
        }

        try {
            
            // Configura canvas para gravação (fora da tela mas visível)
            canvas.width = canvasSize.width;
            canvas.height = canvasSize.height;
            
            // Inicializa heatmap
            heatmapInstance.current = h337.create({
                container: heatmapContainerRef.current,
                radius: 50,
                maxOpacity: 0.6,
                minOpacity: 0.4,
                blur: 0.7,
            });
            
            // Configura container do heatmap
            heatmapContainerRef.current.style.position = 'absolute';
            heatmapContainerRef.current.style.top = '0';
            heatmapContainerRef.current.style.left = '0';
            heatmapContainerRef.current.style.width = '100%';
            heatmapContainerRef.current.style.height = '100%';
            heatmapContainerRef.current.style.pointerEvents = 'none';
            heatmapContainerRef.current.style.zIndex = '10';
            
            // Desenha frame inicial
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (mediaType === 1) {
                // É vídeo - reproduz normalmente
                if (video) {
                    video.play().then(() => {
                        startRecording();
                        drawFrame();
                    }).catch(err => {
                        console.error('❌ Erro ao reproduzir vídeo:', err);
                        setError(`Erro ao reproduzir vídeo: ${err.message}`);
                        return;
                    });
                }
            } else {
                // É imagem - inicia gravação imediatamente
                drawFrame(); // Desenha frame inicial
                startRecording();
                simulateImagePlayback();
            }
            
        } catch (err) {
            console.error('❌ Erro ao iniciar reprodução:', err);
            setError(`Erro ao iniciar reprodução: ${err.message}`);
        }
    };

    /**
     * Simula reprodução para imagens
     */
    const simulateImagePlayback = () => {
        let elapsed = 0;
        
        const interval = setInterval(() => {
            elapsed += 1 / fps;
            setCurrentTime(elapsed);
            
            // Adiciona ponto do heatmap
            addHeatmapPoint(elapsed);
            
            // Desenha frame
            drawFrame();
            
            if (elapsed >= videoDuration) {
                clearInterval(interval);
                stopRecording();
            }
        }, 1000 / fps);
    };

    // Cleanup de URLs quando componente desmonta
    useEffect(() => {
        return () => {
            // Só limpar blob URLs, não URLs diretas
            if (mediaUrl && mediaUrl.startsWith('blob:')) {
                URL.revokeObjectURL(mediaUrl);
            }
            if (downloadLink && downloadLink.startsWith('blob:')) {
                URL.revokeObjectURL(downloadLink);
            }
        };
    }, [mediaUrl, downloadLink]);

    /**
     * Atualiza dados do heatmap quando heatmapData muda
     */
    useEffect(() => {
        if (heatmapInstance.current && heatmapData.length > 0) {
            heatmapInstance.current.setData({
                max: 100,
                data: heatmapData,
            });
        }
    }, [heatmapData]);

    return {
        // Refs
        videoRef,
        canvasRef,
        heatmapContainerRef,
        
        // Estados de dados
        fileName,
        dataFile,
        mediaUrl,
        mediaType,
        coords,
        canvasSize,
        
        // Estados de gravação
        isRecording,
        downloadLink,
        
        // Estados de progresso
        videoDuration,
        currentTime,
        totalCoordinates,
        currentCoordinateIndex,
        
        // Estados de controle
        isLoading,
        error,
        
        // Funções
        handlePlayClick,
        stopRecording,
        updateHeatmapBasedOnTime,
        drawFrame,
        
        // Função para refetch
        refetchData: fetchData,
    };
};

export default useHeatmapVideoLogic;
