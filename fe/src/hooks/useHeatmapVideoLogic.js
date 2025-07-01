import { useState, useEffect, useRef } from "react";
import h337 from '@mars3d/heatmap.js';
import useHeatmapBase from '@/hooks/useHeatmapBase';
import { downloadHeatMapImage } from "@/utils";

/**
 * Hook específico para gerenciar a lógica do HeatmapVideo
 * Usa o hook base para funcionalidades compartilhadas e adiciona gravação de vídeo
 */
const useHeatmapVideoLogic = (id) => {
    console.log(`🎥 useHeatmapVideoLogic initialized with id: ${id}`);
    
    // Estados específicos do vídeo
    const [selectedTestIndex, setSelectedTestIndex] = useState("all");
    const [pointsSpeed, setPointsSpeed] = useState(10); // Pontos por segundo (padrão: 10)

    // Hook base para funcionalidades compartilhadas
    const {
        // Estados de dados do hook base
        fileName,
        dataFile,
        jsonFile,
        mediaUrl,
        mediaType,
        coords,
        canvasSize,
        radiusScale, // Escala do raio calculada dinamicamente
        isLoading,
        error,
        imageRef,
        // Funções do hook base
        calculateDuration,
        setCanvasSize,
        setError,
    } = useHeatmapBase(id, selectedTestIndex, {
        useResponsiveCanvas: false,
        fixedCanvasSize: { width: 800, height: 450 }
    });

    // Ajusta seleção padrão baseado nos dados disponíveis
    useEffect(() => {
        if (dataFile?.jsonData?.length > 1 && selectedTestIndex === "all") {
            // Se há múltiplos testes, força seleção inicial vazia
            setSelectedTestIndex("");
        } else if (dataFile?.jsonData?.length === 1 && selectedTestIndex === "") {
            // Se há apenas um teste, seleciona automaticamente
            setSelectedTestIndex("all");
        }
    }, [dataFile, selectedTestIndex]);

    // Refs específicos do vídeo
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const heatmapContainerRef = useRef(null);
    const heatmapInstance = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);

    // Estados específicos de gravação
    const [isRecording, setIsRecording] = useState(false);
    const [downloadLink, setDownloadLink] = useState(null);
    
    // Estados do heatmap em tempo real
    const [heatmapData, setHeatmapData] = useState([]);
    
    // Estados de tempo/progresso
    const [videoDuration, setVideoDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalCoordinates, setTotalCoordinates] = useState(0);
    
    // Controle de timing mais preciso para vídeos - usar refs para persistir entre re-renders
    const currentCoordinateIndex = useRef(-1); // Começar com -1 para que o primeiro ponto (índice 0) seja adicionado
    const lastProcessedIndex = useRef(0);
    const videoTimerRef = useRef(null);
    const isInitialized = useRef(false); // Flag para evitar re-inicializações
    
    // Throttle para atualizações do heatmap
    const lastHeatmapUpdate = useRef(0);
    const heatmapUpdateThrottle = 100; // ms - permite máximo 10 atualizações por segundo

    // Configurações específicas do vídeo
    const fps = 30;
    const coordinatesPerSecond = pointsSpeed; // Usar a velocidade selecionada pelo usuário

    // Calcula duração e total de coordenadas quando coords mudam
    useEffect(() => {
        if (coords.length > 0) {
            console.log(`📊 Coordinates loaded: ${coords.length} points`);
            console.log(`🎯 First 5 coordinates:`, coords.slice(0, 5));
            console.log(`🎯 Last 5 coordinates:`, coords.slice(-5));
            console.log(`⚡ Points per second: ${coordinatesPerSecond}`);
            
            const duration = calculateDuration(coordinatesPerSecond);
            console.log(`⏱️ Calculated duration: ${duration.toFixed(2)}s`);
            
            setVideoDuration(duration);
            setTotalCoordinates(coords.length);
        } else {
            console.log(`⚠️ No coordinates available`);
        }
    }, [coords, calculateDuration, coordinatesPerSecond]);

    /**
     * Adiciona ponto do heatmap baseado nas coordenadas reais
     */
    const addHeatmapPoint = (timeElapsed) => {
        console.log(`🔍 addHeatmapPoint called with timeElapsed: ${timeElapsed.toFixed(3)}s`);
        
        if (coords.length === 0) {
            console.log(`⚠️ No coordinates available`);
            return false; // Retorna false se não há coordenadas
        }

        // Calcula qual coordenada mostrar baseado no tempo
        const targetIndex = Math.floor(timeElapsed * coordinatesPerSecond);
        console.log(`📊 Calculated target index: ${targetIndex} (timeElapsed: ${timeElapsed.toFixed(3)} * coordinatesPerSecond: ${coordinatesPerSecond})`);
        console.log(`📈 Current coordinate index: ${currentCoordinateIndex.current}, Total coords: ${coords.length}`);
        
        if (targetIndex >= coords.length) {
            console.log(`🏁 Reached end of coordinates (${targetIndex} >= ${coords.length})`);
            stopRecording(); // Para a gravação quando os pontos acabam
            return false; // Retorna false se chegou ao fim
        }

        // 🔧 CORREÇÃO: Evita adicionar pontos duplicados - só adiciona se targetIndex é maior que o atual
        if (targetIndex < currentCoordinateIndex.current) {
            console.log(`⏭️ Skipping - target index ${targetIndex} < current index ${currentCoordinateIndex.current}`);
            return true; // Ainda há pontos, mas não adiciona pontos já processados
        }

        // Se targetIndex == currentCoordinateIndex.current, já foi processado (exceto no caso inicial)
        if (targetIndex === currentCoordinateIndex.current && currentCoordinateIndex.current >= 0) {
            console.log(`⏭️ Skipping - target index ${targetIndex} == current index ${currentCoordinateIndex.current} (already processed)`);
            return true;
        }

        // Adiciona apenas os pontos do currentCoordinateIndex.current+1 até targetIndex
        let addedPoints = 0;
        let nextIndex = Math.max(0, currentCoordinateIndex.current + 1); // Garantir que comece pelo menos no 0
        
        // Se currentCoordinateIndex.current é -1 (inicial), começar do 0
        if (currentCoordinateIndex.current === -1) {
            nextIndex = 0;
        }
        
        while (nextIndex <= targetIndex && nextIndex < coords.length) {
            const coordinate = coords[nextIndex];
            console.log(`📍 Processing coordinate at index ${nextIndex}:`, coordinate);
            
            if (coordinate && coordinate.x !== undefined && coordinate.y !== undefined) {
                // Garantir que as coordenadas estejam dentro dos limites
                const x = Math.max(0, Math.min(canvasSize.width - 1, Math.round(coordinate.x)));
                const y = Math.max(0, Math.min(canvasSize.height - 1, Math.round(coordinate.y)));
                
                const newPoint = {
                    x: x,
                    y: y,
                    value: 100
                };
                
                console.log(`✅ Adding point ${nextIndex}: (${x}, ${y}) from raw (${coordinate.x}, ${coordinate.y})`);
                
                setHeatmapData((prevData) => {
                    const newData = [...prevData, newPoint];
                    console.log(`📋 Heatmap data updated. Previous length: ${prevData.length}, New length: ${newData.length}`);
                    return newData;
                });
                
                addedPoints++;
            } else {
                console.warn(`⚠️ Invalid coordinate at index ${nextIndex}:`, coordinate);
            }
            
            nextIndex++;
        }
        
        // Atualiza o índice atual para o último processado
        if (addedPoints > 0) {
            currentCoordinateIndex.current = targetIndex;
            console.log(`🎯 Updated currentCoordinateIndex to: ${targetIndex} (added ${addedPoints} points)`);
        }
        
        return targetIndex < coords.length; // Retorna true se ainda há pontos para processar (targetIndex vai de 0 a coords.length-1)
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
     * Atualiza heatmap baseado no tempo com controle preciso
     */
    const updateHeatmapBasedOnTime = () => {
        const now = performance.now();
        const timeSinceLastUpdate = now - lastHeatmapUpdate.current;
        
        console.log(`🔄 updateHeatmapBasedOnTime called - Time since last: ${timeSinceLastUpdate.toFixed(1)}ms`);
        
        if (mediaType === 1) {
            // Para vídeos, usa o currentTime do vídeo
            const video = videoRef.current;
            if (video && !video.paused && !video.ended) {
                const videoCurrentTime = video.currentTime;
                console.log(`🎬 Video time update: ${videoCurrentTime.toFixed(3)}s (called ${timeSinceLastUpdate.toFixed(1)}ms after last)`);
                
                // Throttle para evitar chamadas excessivas
                if (timeSinceLastUpdate < heatmapUpdateThrottle) {
                    console.log(`⏭️ Throttling update (${timeSinceLastUpdate}ms < ${heatmapUpdateThrottle}ms)`);
                    return;
                }
                
                lastHeatmapUpdate.current = now;
                setCurrentTime(videoCurrentTime);
                
                // 🔧 CORREÇÃO: Adiciona TODOS os pontos intermediários que foram perdidos
                const targetIndex = Math.floor(videoCurrentTime * coordinatesPerSecond);
                console.log(`🎯 Target index: ${targetIndex}, Current index: ${currentCoordinateIndex.current}`);
                
                // Adiciona todos os pontos do currentCoordinateIndex+1 até targetIndex
                let hasMorePoints = true;
                let nextIndex = currentCoordinateIndex.current + 1;
                
                while (nextIndex <= targetIndex && hasMorePoints) {
                    const timeForThisPoint = nextIndex / coordinatesPerSecond;
                    console.log(`➕ Adding missed point ${nextIndex} at time ${timeForThisPoint.toFixed(3)}s`);
                    hasMorePoints = addHeatmapPoint(timeForThisPoint);
                    
                    if (!hasMorePoints) {
                        console.log(`🏁 No more points available at index ${nextIndex}`);
                        break;
                    }
                    
                    nextIndex++;
                }
                
                console.log(`🔄 Has more points: ${hasMorePoints}`);
                
                // Se não há mais pontos, para o vídeo e a gravação
                if (!hasMorePoints && video) {
                    console.log(`🛑 Stopping video playback - no more points`);
                    video.pause();
                    // stopRecording já foi chamado em addHeatmapPoint
                }
            }
        }
        // Para imagens, o tempo é controlado pelo simulateImagePlayback
    };

    /**
     * Inicia o loop de atualização precisa do heatmap para vídeos
     */
    const startPreciseHeatmapUpdates = () => {
        console.log(`🚀 Starting precise heatmap updates with coordinatesPerSecond: ${coordinatesPerSecond}`);
        lastProcessedIndex.current = 0;
        
        // Para qualquer timer anterior
        if (videoTimerRef.current) {
            console.log(`🛑 Clearing previous timer`);
            clearInterval(videoTimerRef.current);
        }
        
        // Cria um timer que roda na frequência desejada dos pontos
        const timerInterval = 1000 / coordinatesPerSecond; // ms entre pontos
        console.log(`⏱️ Timer interval: ${timerInterval}ms (${coordinatesPerSecond} points per second)`);
        
        videoTimerRef.current = setInterval(() => {
            const video = videoRef.current;
            if (!video || video.paused || video.ended) {
                console.log(`⏸️ Video stopped or ended, stopping timer`);
                stopPreciseHeatmapUpdates();
                return;
            }
            
            const videoCurrentTime = video.currentTime;
            console.log(`⏰ Timer tick - Video time: ${videoCurrentTime.toFixed(3)}s`);
            setCurrentTime(videoCurrentTime);
            
            // Calcula qual ponto deveria ser mostrado baseado no tempo do vídeo
            const targetIndex = Math.floor(videoCurrentTime * coordinatesPerSecond);
            console.log(`🎯 Target index: ${targetIndex}, Last processed: ${lastProcessedIndex.current}`);
            
            // Adiciona pontos se necessário (para catch up se o timer atrasou)
            while (lastProcessedIndex.current <= targetIndex) {
                const timeForThisPoint = lastProcessedIndex.current / coordinatesPerSecond;
                console.log(`➕ Processing point ${lastProcessedIndex.current} at time ${timeForThisPoint.toFixed(3)}s`);
                const hasMorePoints = addHeatmapPoint(timeForThisPoint);
                
                if (!hasMorePoints) {
                    console.log(`🏁 No more points available, stopping`);
                    video.pause();
                    stopPreciseHeatmapUpdates();
                    return;
                }
                
                lastProcessedIndex.current++;
                console.log(`📈 Incremented lastProcessedIndex to: ${lastProcessedIndex.current}`);
            }
        }, timerInterval);
        
        console.log(`✅ Precise timer started with interval ${timerInterval}ms`);
    };

    /**
     * Para o loop de atualização precisa do heatmap
     */
    const stopPreciseHeatmapUpdates = () => {
        if (videoTimerRef.current) {
            clearInterval(videoTimerRef.current);
            videoTimerRef.current = null;
        }
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
        
        // Para o loop de atualização precisa
        stopPreciseHeatmapUpdates();
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
            // Limpa dados anteriores do heatmap e reset states
            setHeatmapData([]);
            setCurrentTime(0);
            currentCoordinateIndex.current = -1; // Começar com -1 para incluir o primeiro ponto
            isInitialized.current = false; // Reset flag
            
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
                // Garantir que o container tenha dimensões
                if (heatmapContainerRef.current.offsetWidth === 0 || heatmapContainerRef.current.offsetHeight === 0) {
                    heatmapContainerRef.current.style.width = `${canvasSize.width}px`;
                    heatmapContainerRef.current.style.height = `${canvasSize.height}px`;
                }
                
                heatmapInstance.current = h337.create({
                    container: heatmapContainerRef.current,
                    radius: Math.max(10, 50 * radiusScale), // Usa radiusScale calculado dinamicamente
                    maxOpacity: 1, // Mesma opacidade máxima do heatmap estático
                    minOpacity: 0.2, // Mesma opacidade mínima do heatmap estático
                    blur: 0.9, // Mesmo blur do heatmap estático
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
                
                // Aguarda um momento para o heatmap ser criado e configura
                setTimeout(() => {
                    const heatmapCanvas = heatmapContainerRef.current.querySelector('.heatmap-canvas');
                    if (heatmapCanvas) {
                        // Forçar visibilidade do canvas
                        heatmapCanvas.style.display = 'block';
                        heatmapCanvas.style.opacity = '1';
                        heatmapCanvas.style.pointerEvents = 'none';
                        heatmapCanvas.style.position = 'absolute';
                        heatmapCanvas.style.top = '0';
                        heatmapCanvas.style.left = '0';
                        heatmapCanvas.style.zIndex = '10';
                        
                        // Adicionar ponto de teste para verificar funcionamento
                        heatmapInstance.current.setData({
                            max: 100,
                            data: [{ x: canvasSize.width / 2, y: canvasSize.height / 2, value: 100 }]
                        });
                        
                        // Limpar teste após 2 segundos
                        setTimeout(() => {
                            if (heatmapInstance.current) {
                                heatmapInstance.current.setData({ max: 100, data: [] });
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
                    console.log(`🎬 Starting video playback`);
                    video.play().then(() => {
                        console.log(`▶️ Video started playing`);
                        startRecording();
                        drawFrame();
                        // Para vídeos, o heatmap é atualizado via event listener timeupdate
                    }).catch(err => {
                        console.error('❌ Erro ao reproduzir vídeo:', err);
                        setError(`Erro ao reproduzir vídeo: ${err.message}`);
                        return;
                    });
                }
            } else {
                // É imagem - inicia gravação imediatamente
                console.log(`🖼️ Starting image mode`);
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
        // Evitar múltiplas inicializações
        if (isInitialized.current) {
            console.log(`⚠️ simulateImagePlayback already running, ignoring duplicate call`);
            return;
        }
        
        console.log(`🖼️ Starting image simulation with ${coords.length} points at ${coordinatesPerSecond} points/second`);
        
        // Marcar como inicializado
        isInitialized.current = true;
        
        // Reset states para garantir que comece do zero
        setCurrentTime(0);
        currentCoordinateIndex.current = -1; // Começar com -1 para que o índice 0 seja o primeiro
        setHeatmapData([]);
        
        let elapsed = 0;
        let frameCount = 0;
        
        const interval = setInterval(() => {
            elapsed += 1 / fps;
            frameCount++;
            console.log(`⏰ Image simulation frame ${frameCount}, time: ${elapsed.toFixed(3)}s`);
            setCurrentTime(elapsed);
            
            // Adiciona ponto do heatmap e verifica se ainda há pontos
            const hasMorePoints = addHeatmapPoint(elapsed);
            console.log(`🔄 Image simulation - Has more points: ${hasMorePoints}`);
            
            // Desenha frame
            drawFrame();
            
            // Para quando os pontos do heatmap acabam (prioridade) ou quando atinge a duração máxima
            if (!hasMorePoints) {
                console.log(`🏁 Image simulation finished - no more points`);
                clearInterval(interval);
                isInitialized.current = false; // Reset flag
                return; // stopRecording já foi chamado em addHeatmapPoint
            }
            
            // Fallback: para se exceder a duração estimada (para evitar loops infinitos)
            if (elapsed >= videoDuration) {
                console.log(`⏱️ Image simulation finished - reached duration limit (${videoDuration}s)`);
                clearInterval(interval);
                isInitialized.current = false; // Reset flag
                stopRecording();
            }
        }, 1000 / fps);
    };

    // Cleanup de URLs e timers quando componente desmonta
    useEffect(() => {
        return () => {
            // Só limpar blob URLs, não URLs diretas
            if (mediaUrl && mediaUrl.startsWith('blob:')) {
                URL.revokeObjectURL(mediaUrl);
            }
            if (downloadLink && downloadLink.startsWith('blob:')) {
                URL.revokeObjectURL(downloadLink);
            }
            
            // Para timers
            stopPreciseHeatmapUpdates();
        };
    }, [mediaUrl, downloadLink]);

    /**
     * Atualiza dados do heatmap quando heatmapData muda
     */
    useEffect(() => {
        if (heatmapInstance.current && heatmapData.length > 0) {
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
                        } catch (innerError) {
                            console.warn('⚠️ Inner heatmap update error:', innerError);
                            
                            // Se continuar falhando, tentar recriar a instância do heatmap
                            if (innerError.message.includes('read only property')) {
                                try {
                                    // Limpar container
                                    if (heatmapContainerRef.current) {
                                        heatmapContainerRef.current.innerHTML = '';
                                        
                                        // Recriar instância
                                        heatmapInstance.current = h337.create({
                                            container: heatmapContainerRef.current,
                                            radius: Math.max(10, 50 * radiusScale), // Usa radiusScale calculado dinamicamente
                                            maxOpacity: 1, // Mesma opacidade máxima do heatmap estático
                                            minOpacity: 0.2, // Mesma opacidade mínima do heatmap estático
                                            blur: 0.9, // Mesmo blur do heatmap estático
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

    // Função para atualizar seleção de teste
    const updateTestSelection = (newSelectedIndex) => {
        console.log(`🔄 Updating test selection from ${selectedTestIndex} to ${newSelectedIndex}`);
        // Só permite mudança quando não está gravando
        if (!isRecording) {
            setSelectedTestIndex(newSelectedIndex);
            // Reset estados de progresso quando muda seleção
            setCurrentTime(0);
            currentCoordinateIndex.current = -1; // Reset para -1 para incluir o primeiro ponto
            setHeatmapData([]);
            isInitialized.current = false; // Reset flag
            
            // Para timers
            stopPreciseHeatmapUpdates();
            
            // Limpa download link anterior
            if (downloadLink && downloadLink.startsWith('blob:')) {
                URL.revokeObjectURL(downloadLink);
                setDownloadLink(null);
            }
            console.log(`✅ Test selection updated and states reset`);
        } else {
            console.log(`⚠️ Cannot change test selection while recording`);
        }
    };

    // Função para atualizar velocidade dos pontos
    const updatePointsSpeed = (newSpeed) => {
        console.log(`🔄 Updating points speed from ${pointsSpeed} to ${newSpeed}`);
        // Só permite mudança quando não está gravando
        if (!isRecording) {
            setPointsSpeed(newSpeed);
            // Reset estados de progresso quando muda velocidade
            setCurrentTime(0);
            currentCoordinateIndex.current = -1; // Reset para -1 para incluir o primeiro ponto
            setHeatmapData([]);
            isInitialized.current = false; // Reset flag
            
            // Para timers
            stopPreciseHeatmapUpdates();
            
            // Limpa download link anterior
            if (downloadLink && downloadLink.startsWith('blob:')) {
                URL.revokeObjectURL(downloadLink);
                setDownloadLink(null);
            }
            console.log(`✅ Points speed updated and states reset`);
        } else {
            console.log(`⚠️ Cannot change points speed while recording`);
        }
    };

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
        currentCoordinateIndex: Math.max(0, currentCoordinateIndex.current), // Mostrar pelo menos 0 na UI
        
        // Estados de controle
        isLoading,
        error,
        
        // Estados de seleção
        selectedTestIndex,
        setSelectedTestIndex,
        pointsSpeed,
        setPointsSpeed,
        
        // Funções
        handlePlayClick,
        stopRecording,
        updateHeatmapBasedOnTime,
        drawFrame,
        updateTestSelection,
        updatePointsSpeed,
    };
};

export default useHeatmapVideoLogic;
