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
    
    // Throttle para atualizações do heatmap
    const lastHeatmapUpdate = useRef(0);
    const heatmapUpdateThrottle = 100; // ms

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
        if (coords.length === 0) {
            console.log('🔍 No coordinates available');
            return;
        }

        // Calcula qual coordenada mostrar baseado no tempo
        const coordinateIndex = Math.floor(timeElapsed * coordinatesPerSecond);
        
        if (coordinateIndex >= coords.length) {
            console.log('🔍 Index out of bounds:', coordinateIndex, '/', coords.length);
            return;
        }

        const coordinate = coords[coordinateIndex];
        
        if (coordinate && coordinate.x !== undefined && coordinate.y !== undefined) {
            // Garantir que as coordenadas estejam dentro dos limites
            const x = Math.max(0, Math.min(canvasSize.width - 1, Math.round(coordinate.x)));
            const y = Math.max(0, Math.min(canvasSize.height - 1, Math.round(coordinate.y)));
            
            const newPoint = {
                x: x,
                y: y,
                value: 100
            };

            console.log('🎯 Adding point:', newPoint, 'time:', timeElapsed.toFixed(2));
            
            setHeatmapData((prevData) => {
                const newData = [...prevData, newPoint];
                
                // Throttle das atualizações diretas do heatmap
                const now = Date.now();
                if (heatmapInstance.current && (now - lastHeatmapUpdate.current) > heatmapUpdateThrottle) {
                    lastHeatmapUpdate.current = now;
                    
                    try {
                        // Usar todos os pontos para atualizações
                        const quickUpdateData = newData.map(point => ({
                            x: Number(point.x),
                            y: Number(point.y),
                            value: Number(point.value)
                        }));
                        
                        heatmapInstance.current.setData({
                            max: 100,
                            data: quickUpdateData,
                        });
                    } catch (error) {
                        console.warn('⚠️ Throttled update error:', error);
                    }
                }
                
                return newData;
            });
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

        if (canvas.width === 0 || canvas.height === 0) {
            console.warn('⚠️ Canvas has zero dimensions');
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
            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            } catch (error) {
                console.warn('⚠️ Error drawing video to canvas:', error);
            }
        } else if (mediaType === 0) {
            // É uma imagem - usa referência em cache
            if (imageRef.current) {
                try {
                    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
                } catch (error) {
                    console.warn('⚠️ Error drawing image to canvas:', error);
                }
            } else if (mediaUrl) {
                // Primeira vez - carrega a imagem
                const img = new Image();
                img.onload = () => {
                    imageRef.current = img;
                    try {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // Desenha heatmap após carregar imagem
                        const overlayCanvas = document.querySelector('.heatmap-canvas');
                        if (overlayCanvas && overlayCanvas.width > 0 && overlayCanvas.height > 0) {
                            ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
                        }
                    } catch (error) {
                        console.warn('⚠️ Error drawing loaded image to canvas:', error);
                    }
                };
                img.onerror = () => {
                    console.error('❌ Failed to load image for canvas drawing');
                };
                img.crossOrigin = 'anonymous';
                img.src = mediaUrl;
                return; // Sai da função para evitar desenhar heatmap antes da imagem
            }
        }

        // Desenha overlay do heatmap
        const overlayCanvas = document.querySelector('.heatmap-canvas');
        if (overlayCanvas && overlayCanvas.width > 0 && overlayCanvas.height > 0) {
            try {
                ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
            } catch (error) {
                console.warn('⚠️ Error drawing heatmap overlay to canvas:', error);
            }
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

        if (canvas.width === 0 || canvas.height === 0) {
            console.error('❌ Canvas has invalid dimensions for recording');
            setError("Canvas não possui dimensões válidas para gravação");
            return;
        }

        // Verificar se o canvas tem contexto válido
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('❌ Canvas context not available');
            setError("Contexto do canvas não disponível");
            return;
        }

        // Desenha frame inicial garantindo que não há erros
        try {
            drawFrame();
        } catch (drawError) {
            console.error('❌ Error drawing initial frame:', drawError);
            setError(`Erro ao desenhar frame inicial: ${drawError.message}`);
            return;
        }

        // Verificar se o canvas tem conteúdo após desenhar
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasContent = imageData.data.some(pixel => pixel !== 0);
            
            if (!hasContent) {
                console.warn('⚠️ Canvas still appears to be empty after drawing frame');
            }
        } catch (imageDataError) {
            console.warn('⚠️ Could not verify canvas content:', imageDataError);
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

        // Verificar se a biblioteca heatmap está disponível
        if (!h337 || typeof h337.create !== 'function') {
            console.error('❌ Heatmap library not available:', h337);
            setError("Biblioteca de heatmap não carregada");
            return;
        }

        try {
            // Limpa dados anteriores do heatmap
            setHeatmapData([]);
            
            // Configura canvas para gravação
            canvas.width = canvasSize.width;
            canvas.height = canvasSize.height;
            
            // Verifica se as dimensões foram aplicadas corretamente
            if (canvas.width === 0 || canvas.height === 0) {
                setError("Canvas não foi inicializado com dimensões válidas");
                return;
            }
            
            // Limpa container do heatmap antes de inicializar
            heatmapContainerRef.current.innerHTML = '';
            
            // Inicializa heatmap com verificação
            try {
                console.log('🎯 Creating heatmap instance...');
                
                // Garantir que o container tenha dimensões
                if (heatmapContainerRef.current.offsetWidth === 0 || heatmapContainerRef.current.offsetHeight === 0) {
                    console.log('🔧 Setting explicit container dimensions');
                    heatmapContainerRef.current.style.width = `${canvasSize.width}px`;
                    heatmapContainerRef.current.style.height = `${canvasSize.height}px`;
                }
                
                heatmapInstance.current = h337.create({
                    container: heatmapContainerRef.current,
                    radius: 30, // Raio menor para ser mais visível
                    maxOpacity: 0.8, // Maior opacidade
                    minOpacity: 0.3,
                    blur: 0.8,
                    backgroundColor: 'rgba(0,0,0,0)', // Fundo transparente explícito
                    gradient: { // Gradient customizado mais visível
                        '0.0': 'rgba(0,0,0,0)',
                        '0.2': 'rgba(0,0,255,0.6)',
                        '0.4': 'rgba(0,255,255,0.7)', 
                        '0.6': 'rgba(0,255,0,0.8)',
                        '0.8': 'rgba(255,255,0,0.9)',
                        '1.0': 'rgba(255,0,0,1.0)'
                    }
                });
                
                console.log('✅ Heatmap instance created:', heatmapInstance.current);
                
                // Aguarda um momento para o heatmap ser criado e configura
                setTimeout(() => {
                    const heatmapCanvas = heatmapContainerRef.current.querySelector('.heatmap-canvas');
                    if (heatmapCanvas) {
                        console.log('✅ Heatmap canvas found:', heatmapCanvas.width, 'x', heatmapCanvas.height);
                        
                        // Forçar visibilidade do canvas
                        heatmapCanvas.style.display = 'block';
                        heatmapCanvas.style.opacity = '1';
                        heatmapCanvas.style.pointerEvents = 'none';
                        heatmapCanvas.style.position = 'absolute';
                        heatmapCanvas.style.top = '0';
                        heatmapCanvas.style.left = '0';
                        heatmapCanvas.style.zIndex = '10';
                        
                        // Adicionar ponto de teste para verificar funcionamento
                        console.log('🧪 Adding test point...');
                        heatmapInstance.current.setData({
                            max: 100,
                            data: [{ x: canvasSize.width / 2, y: canvasSize.height / 2, value: 100 }]
                        });
                        
                        // Limpar teste após 2 segundos
                        setTimeout(() => {
                            if (heatmapInstance.current) {
                                heatmapInstance.current.setData({ max: 100, data: [] });
                                console.log('🧪 Test cleared, ready for real data');
                            }
                        }, 2000);
                        
                    } else {
                        console.warn('⚠️ Heatmap canvas not found after creation');
                    }
                }, 100);
                
            } catch (heatmapError) {
                console.error('❌ Error creating heatmap:', heatmapError);
                setError(`Erro ao criar heatmap: ${heatmapError.message}`);
                return;
            }
            
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
            console.log('🎯 Updating heatmap with', heatmapData.length, 'points');
            console.log('🎯 Sample data:', heatmapData.slice(-3));
            
            try {
                // Usar um timeout para evitar atualizações muito frequentes
                const timeoutId = setTimeout(() => {
                    if (heatmapInstance.current) {
                        try {
                            // Criar uma nova instância dos dados para evitar problemas de referência
                            const safeData = heatmapData.map(point => ({
                                x: Number(point.x),
                                y: Number(point.y),
                                value: Number(point.value)
                            }));
                            
                            heatmapInstance.current.setData({
                                max: 100,
                                data: safeData,
                            });
                            
                            console.log('✅ Heatmap updated successfully with', safeData.length, 'points');
                        } catch (innerError) {
                            console.warn('⚠️ Inner heatmap update error:', innerError);
                            
                            // Se continuar falhando, tentar recriar a instância do heatmap
                            if (innerError.message.includes('read only property')) {
                                console.log('🔄 Attempting to recreate heatmap instance due to read-only error...');
                                try {
                                    // Limpar container
                                    if (heatmapContainerRef.current) {
                                        heatmapContainerRef.current.innerHTML = '';
                                        
                                        // Recriar instância
                                        heatmapInstance.current = h337.create({
                                            container: heatmapContainerRef.current,
                                            radius: 30,
                                            maxOpacity: 0.8,
                                            minOpacity: 0.3,
                                            blur: 0.8,
                                            backgroundColor: 'rgba(0,0,0,0)',
                                            gradient: {
                                                '0.0': 'rgba(0,0,0,0)',
                                                '0.2': 'rgba(0,0,255,0.6)',
                                                '0.4': 'rgba(0,255,255,0.7)', 
                                                '0.6': 'rgba(0,255,0,0.8)',
                                                '0.8': 'rgba(255,255,0,0.9)',
                                                '1.0': 'rgba(255,0,0,1.0)'
                                            }
                                        });
                                        
                                        console.log('✅ Heatmap instance recreated');
                                    }
                                } catch (recreateError) {
                                    console.error('❌ Failed to recreate heatmap:', recreateError);
                                }
                            }
                        }
                    }
                }, 50); // Debounce de 50ms
                
                return () => clearTimeout(timeoutId);
                
            } catch (error) {
                console.error('❌ Error updating heatmap:', error);
            }
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
