import { useState, useEffect, useRef } from "react";
import h337 from '@mars3d/heatmap.js';
import useHeatmapBase from '@/hooks/useHeatmapBase';

/**
 * Hook específico para gerenciar a lógica do HeatmapVideo
 * Usa o hook base para funcionalidades compartilhadas e adiciona gravação de vídeo
 */
const useHeatmapVideoLogic = (id) => {
    
    // Estados específicos do vídeo
    const [selectedTestIndex, setSelectedTestIndex] = useState("all");
    const [pointsSpeed, setPointsSpeed] = useState(10); // Pontos por segundo (padrão: 10)
    const [showTrackingBall, setShowTrackingBall] = useState(false); // Nova funcionalidade: bola de rastreamento

    // Hook base para funcionalidades compartilhadas
    const {
        // Estados de dados do hook base
        fileName,
        dataFile,
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
    
    // Ref para posição da bola de rastreamento (somente ref para evitar re-renders)
    const currentTrackingPositionRef = useRef(null); // Ref para atualização imediata durante o desenho
    
    // Refs para interpolação suave da bola de rastreamento
    const trackingCurrentPosition = useRef(null); // Posição atual da coordenada (pontual)
    const trackingNextPosition = useRef(null); // Próxima posição da coordenada
    const trackingInterpolatedPosition = useRef(null); // Posição interpolada atual
    
    // Estados de tempo/progresso
    const [videoDuration, setVideoDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalCoordinates, setTotalCoordinates] = useState(0);
    
    // Controle de timing mais preciso para vídeos - usar refs para persistir entre re-renders
    const currentCoordinateIndex = useRef(-1); // Começar com -1 para que o primeiro ponto (índice 0) seja adicionado
    const isInitialized = useRef(false); // Flag para evitar re-inicializações
    const animationFrameId = useRef(null); // Ref para o ID do requestAnimationFrame

    // Configurações específicas do timing
    const coordinatesPerSecond = pointsSpeed; // Usar a velocidade selecionada pelo usuário

    /**
     * Reseta todos os estados relacionados à reprodução e gravação.
     */
    const resetPlaybackState = () => {
        setCurrentTime(0);
        setHeatmapData([]);
        currentCoordinateIndex.current = -1;
        currentTrackingPositionRef.current = null;
        trackingCurrentPosition.current = null;
        trackingNextPosition.current = null;
        trackingInterpolatedPosition.current = null;
        isInitialized.current = false;

        if (downloadLink && downloadLink.startsWith('blob:')) {
            URL.revokeObjectURL(downloadLink);
            setDownloadLink(null);
        }

        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
    };

    /**
     * Atualiza a posição interpolada da bola de rastreamento para movimento suave
     */
    const updateTrackingBallPosition = (timeElapsed) => {
        if (!showTrackingBall || coords.length === 0) {
            return;
        }

        // Calcula índice atual e próximo baseado no tempo
        const exactIndex = timeElapsed * coordinatesPerSecond;
        const currentIndex = Math.floor(exactIndex);
        const nextIndex = Math.min(currentIndex + 1, coords.length - 1);
        
        // Fator de interpolação (0 a 1) baseado na parte fracionária
        const t = exactIndex - currentIndex;
        
        if (currentIndex >= coords.length) {
            return;
        }
        
        const currentCoord = coords[currentIndex];
        const nextCoord = coords[nextIndex];
        
        if (!currentCoord || !nextCoord) {
            return;
        }
        
        // Interpolação linear entre posição atual e próxima
        const interpolatedX = currentCoord.x + (nextCoord.x - currentCoord.x) * t;
        const interpolatedY = currentCoord.y + (nextCoord.y - currentCoord.y) * t;
        
        // Garantir que as coordenadas estejam dentro dos limites
        const x = Math.max(0, Math.min(canvasSize.width - 1, Math.round(interpolatedX)));
        const y = Math.max(0, Math.min(canvasSize.height - 1, Math.round(interpolatedY)));
        
        const position = { x, y };
        // Só atualizar o ref - não o estado para evitar re-renders excessivos
        currentTrackingPositionRef.current = position;
    };

    // Calcula duração e total de coordenadas quando coords mudam
    useEffect(() => {
        if (coords.length > 0) {
            const duration = calculateDuration(coordinatesPerSecond);
            
            setVideoDuration(duration);
            setTotalCoordinates(coords.length);
        }
    }, [coords, calculateDuration, coordinatesPerSecond]);

    /**
     * Adiciona ponto do heatmap baseado nas coordenadas reais
     */
    const addHeatmapPoint = (timeElapsed) => {
        if (coords.length === 0) {
            return false; // Retorna false se não há coordenadas
        }

        // Atualiza posição interpolada da bola de rastreamento
        updateTrackingBallPosition(timeElapsed);

        // Calcula qual coordenada mostrar baseado no tempo
        const targetIndex = Math.floor(timeElapsed * coordinatesPerSecond);
        
        if (targetIndex >= coords.length) {
            stopRecording(); // Para a gravação quando os pontos acabam
            return false; // Retorna false se chegou ao fim
        }

        // 🔧 CORREÇÃO: Evita adicionar pontos duplicados - só adiciona se targetIndex é maior que o atual
        if (targetIndex < currentCoordinateIndex.current) {
            return true; // Ainda há pontos, mas não adiciona pontos já processados
        }

        // Se targetIndex == currentCoordinateIndex.current, já foi processado (exceto no caso inicial)
        if (targetIndex === currentCoordinateIndex.current && currentCoordinateIndex.current >= 0) {
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
            
            if (coordinate && coordinate.x !== undefined && coordinate.y !== undefined) {
                // Garantir que as coordenadas estejam dentro dos limites
                const x = Math.max(0, Math.min(canvasSize.width - 1, Math.round(coordinate.x)));
                const y = Math.max(0, Math.min(canvasSize.height - 1, Math.round(coordinate.y)));
                
                const newPoint = {
                    x: x,
                    y: y,
                    value: 100
                };
                
                setHeatmapData((prevData) => {
                    const newData = [...prevData, newPoint];
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
        }
        
        return targetIndex < coords.length; // Retorna true se ainda há pontos para processar (targetIndex vai de 0 a coords.length-1)
    };

    /**
     * Função de desenho do frame
     */
    const drawFrame = () => {
        // Verificação robusta do canvas
        if (!canvasRef.current) {
            return; // Retorna silenciosamente se canvas não existe
        }

        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        if (canvas.width === 0 || canvas.height === 0) {
            return; // Retorna silenciosamente se canvas tem dimensões inválidas
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return; // Retorna silenciosamente se contexto não está disponível
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

        // Desenha bola de rastreamento se ativada e há posição atual
        // IMPORTANTE: Desenhar por último para aparecer em cima de tudo
        if (showTrackingBall && currentTrackingPositionRef.current) {
            const { x, y } = currentTrackingPositionRef.current;
            const ballRadius = 8; // Raio da bola

            // Salvar contexto atual
            ctx.save();

            // Sombra/borda preta externa
            ctx.beginPath();
            ctx.arc(x, y, ballRadius + 2, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();

            // Borda branca
            ctx.beginPath();
            ctx.arc(x, y, ballRadius + 1, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();

            // Bola vermelha principal
            ctx.beginPath();
            ctx.arc(x, y, ballRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            // Restaurar contexto
            ctx.restore();
        }

        // Continua o loop de desenho se estiver gravando
        if (isRecording && canvasRef.current) {
            requestAnimationFrame(drawFrame);
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
            if (canvasRef.current) {
                drawFrame();
            }
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

        const stream = canvas.captureStream(30); // 30 FPS para a gravação
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

        // Reinicia o vídeo para o início, se for um vídeo
        if (mediaType === 1 && video) {
            video.currentTime = 0;
        }
        
        
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
            currentTrackingPositionRef.current = null; // Reset ref da bola de tracking
            trackingCurrentPosition.current = null; // Reset refs de interpolação
            trackingNextPosition.current = null;
            trackingInterpolatedPosition.current = null;
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
                    if (heatmapContainerRef.current) {
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
                    } else {
                        console.warn('⚠️ Heatmap container ref is null');
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
                // É vídeo - inicia timer controlado em vez de depender de timeupdate
                if (video) {
                    video.play().then(() => {
                        startRecording();
                        if (canvasRef.current) {
                            drawFrame();
                        }
                        // Para vídeos, usar timer controlado como nas imagens
                        simulatePlayback();
                    }).catch(err => {
                        console.error('❌ Erro ao reproduzir vídeo:', err);
                        setError(`Erro ao reproduzir vídeo: ${err.message}`);
                        return;
                    });
                }
            } else {
                // É imagem - inicia gravação imediatamente
                if (canvasRef.current) {
                    drawFrame(); // Desenha frame inicial
                }
                startRecording();
                simulatePlayback();
            }
            
        } catch (err) {
            console.error('❌ Erro ao iniciar reprodução:', err);
            setError(`Erro ao iniciar reprodução: ${err.message}`);
        }
    };

    /**
     * Simula a reprodução para imagens e vídeos com timing preciso,
     * atualizando o heatmap e a bola de rastreamento.
     */
    const simulatePlayback = () => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        resetPlaybackState();

        const startTime = performance.now();
        let lastTimeUpdate = 0;

        const animate = () => {
            const video = videoRef.current;
            if (!canvasRef.current) {
                stopRecording();
                isInitialized.current = false;
                return;
            }

            // Para a animação se o vídeo for pausado ou terminar (apenas para mídia de vídeo)
            if (mediaType === 1 && (!video || video.paused || video.ended)) {
                isInitialized.current = false;
                return;
            }

            const currentTimestamp = performance.now();
            let elapsed = (currentTimestamp - startTime) / 1000;

            // Sincroniza com o tempo do vídeo se a diferença for grande
            if (mediaType === 1 && video) {
                const videoTime = video.currentTime;
                if (Math.abs(elapsed - videoTime) > 0.5) {
                    elapsed = videoTime;
                }
            }

            if (elapsed - lastTimeUpdate >= 0.1) {
                setCurrentTime(elapsed);
                lastTimeUpdate = elapsed;
            }

            const hasMorePoints = addHeatmapPoint(elapsed);
            drawFrame();

            if (!hasMorePoints || elapsed >= videoDuration) {
                stopRecording();
                isInitialized.current = false;
                if (mediaType === 1 && video && !video.paused) {
                    video.pause();
                }
                return;
            }

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);
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
        // Só permite mudança quando não está gravando
        if (!isRecording) {
            setSelectedTestIndex(newSelectedIndex);
            // Reset estados de progresso quando muda seleção
            resetPlaybackState();
        } else {
            console.log(`⚠️ Cannot change test selection while recording`);
        }
    };

    // Função para atualizar velocidade dos pontos
    const updatePointsSpeed = (newSpeed) => {
        // Só permite mudança quando não está gravando
        if (!isRecording) {
            setPointsSpeed(newSpeed);
            // Reset estados de progresso quando muda velocidade
            resetPlaybackState();
        } else {
            console.log(`⚠️ Cannot change points speed while recording`);
        }
    };

    // Função para atualizar estado da bola de tracking
    const updateTrackingBall = (enabled) => {
        console.log(`🔴 updateTrackingBall called with:`, { enabled, isRecording });
        // Só permite mudança quando não está gravando
        if (!isRecording) {
            setShowTrackingBall(enabled);
            console.log(`🔴 Tracking ball set to:`, enabled);
            // Reset posição se desabilitado
            if (!enabled) {
                currentTrackingPositionRef.current = null; // Reset ref da bola de tracking
                trackingCurrentPosition.current = null; // Reset refs de interpolação
                trackingNextPosition.current = null;
                trackingInterpolatedPosition.current = null;
            }
        } else {
            console.log(`⚠️ Cannot change tracking ball while recording`);
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
        
        // Estados da bola de tracking
        showTrackingBall,
        setShowTrackingBall,
        
        // Funções
        handlePlayClick,
        stopRecording,
        drawFrame,
        updateTestSelection,
        updatePointsSpeed,
        updateTrackingBall,
    };
};

export default useHeatmapVideoLogic;
