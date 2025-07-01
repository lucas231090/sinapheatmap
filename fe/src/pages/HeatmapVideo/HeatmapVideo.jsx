import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useHeatmapVideoLogic from '@/hooks/useHeatmapVideoLogic';
import TestSelector from '@/components/HeatmapStatic/TestSelector';
import SpeedSelector from '@/components/HeatmapVideo/SpeedSelector';

const VideoHeatmap = () => {
    const { id } = useParams();
    const [refsReady, setRefsReady] = useState(false);
    
    // Hook centralizado para toda a lógica
    const {
        // Refs
        videoRef,
        canvasRef,
        heatmapContainerRef,
        
        // Estados de dados
        fileName,
        dataFile,
        mediaUrl,
        mediaType,
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
    } = useHeatmapVideoLogic(id);

    // Configurar event listeners para vídeo se for mídia de vídeo
    useEffect(() => {
        const video = videoRef.current;
        if (!video || mediaType !== 1) return;

        const handleLoadedMetadata = () => {
            if (video.duration) {
                // Para vídeos, usar a duração real do vídeo
                // mas limitar pela quantidade de coordenadas disponíveis
                const coordDuration = totalCoordinates / 10; // 10 coordenadas por segundo
                const actualDuration = Math.min(video.duration, coordDuration);
                // Usar a duração já calculada no hook baseada nas coordenadas
            }
        };
        const handleEnded = () => stopRecording();
        const handleError = (e) => {
            console.error('Video error:', e);
            console.error('Video error details:', video.error);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);
        
        // Event listener para atualizar heatmap conforme vídeo toca
        video.addEventListener('timeupdate', updateHeatmapBasedOnTime);

        if (isRecording && mediaType === 1) {
            drawFrame();
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
            video.removeEventListener('timeupdate', updateHeatmapBasedOnTime);
        };
    }, [isRecording, mediaType, updateHeatmapBasedOnTime, stopRecording, drawFrame, totalCoordinates]);

    // Verificar se os refs estão prontos
    useEffect(() => {
        const checkRefs = () => {
            if (canvasRef.current && heatmapContainerRef.current) {
                setRefsReady(true);
            }
        };
        
        checkRefs();
        
        // Se ainda não estão prontos, verificar novamente após um tempo
        if (!refsReady) {
            const timeout = setTimeout(checkRefs, 100);
            return () => clearTimeout(timeout);
        }
    }, [canvasRef, heatmapContainerRef, refsReady]);

    // Exibe loading se estiver carregando
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-xl text-gray-700">Carregando dados do teste...</div>
                </div>
            </div>
        );
    }

    // Exibe erro se houver
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-xl text-red-500">Erro: {error}</div>
                </div>
            </div>
        );
    }

    // Se não há ID, exibe mensagem
    if (!id) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-xl text-gray-700">Nenhum ID de teste fornecido</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Caixa branca principal no meio da tela */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            {fileName || 'Teste de Eye Tracking'}
                        </h1>
                        
                        {/* Seletor de Teste */}
                        {dataFile?.jsonData?.length > 1 && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Selecionar Teste:
                                </label>
                                <TestSelector
                                    dataFile={dataFile}
                                    selectedTestIndex={selectedTestIndex}
                                    setSelectedTestIndex={updateTestSelection}
                                    disabled={isRecording}
                                />
                                {selectedTestIndex === "" && (
                                    <p className="text-sm text-orange-600 mt-1">
                                        Este arquivo contém múltiplos testes. Selecione um teste para continuar.
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {/* Seletor de Velocidade dos Pontos */}
                        <div className="mb-6">
                            <SpeedSelector
                                pointsSpeed={pointsSpeed}
                                setPointsSpeed={updatePointsSpeed}
                                disabled={isRecording}
                            />
                        </div>
                        
                        <div className="space-y-2 mb-6">
                            <p className="text-lg text-gray-600">ID: {id}</p>
                            <p className="text-lg text-gray-600">
                                Tipo de arquivo: {mediaType === 1 ? 'Vídeo' : 'Imagem'}
                            </p>
                            {dataFile?.jsonData?.length > 1 && (
                                <p className="text-lg text-gray-600">
                                    Teste selecionado: {
                                        selectedTestIndex === "all" ? "Todos os testes combinados" :
                                        selectedTestIndex === "" ? "Nenhum teste selecionado" :
                                        `Teste ${parseInt(selectedTestIndex) + 1}`
                                    }
                                </p>
                            )}
                            <p className="text-lg text-gray-600">
                                Coordenadas disponíveis: {totalCoordinates}
                            </p>
                            <p className="text-lg text-gray-600">
                                Velocidade: {pointsSpeed} pontos/segundo
                            </p>
                            <p className="text-lg text-gray-600">
                                Duração estimada: {videoDuration.toFixed(1)}s
                            </p>
                        </div>

                        <div className="flex justify-center space-x-4">
                            {!isRecording && !downloadLink && (
                                <button 
                                    className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl transform active:translate-y-1 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={handlePlayClick}
                                    disabled={
                                        !mediaUrl || 
                                        totalCoordinates === 0 || 
                                        !refsReady || 
                                        (dataFile?.jsonData?.length > 1 && selectedTestIndex === "")
                                    }
                                >
                                    {!refsReady ? 'Preparando...' :
                                     !mediaUrl ? 'Carregando mídia...' : 
                                     (dataFile?.jsonData?.length > 1 && selectedTestIndex === "") ? 'Selecione um teste' :
                                     totalCoordinates === 0 ? 'Sem coordenadas disponíveis' : 
                                     'Iniciar Gravação'}
                                </button>
                            )}

                            {downloadLink && (
                                <a 
                                    href={downloadLink} 
                                    download={`heatmap-${fileName}.webm`}
                                    className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl transform active:translate-y-1 transition-all duration-200"
                                >
                                    Baixar Vídeo
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Container da área de gravação - renderizado sempre mas visível apenas durante gravação */}
                <div className={`bg-white rounded-2xl shadow-lg p-8 mb-8 ${!isRecording ? 'hidden' : ''}`}>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gravando...</h2>
                        <div className="space-y-2">
                            <p className="text-lg text-gray-600">
                                Progresso: {currentCoordinateIndex}/{totalCoordinates} coordenadas
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="bg-sky-500 h-3 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${totalCoordinates > 0 ? (currentCoordinateIndex / totalCoordinates) * 100 : 0}%` 
                                    }}
                                ></div>
                            </div>
                            <p className="text-lg text-gray-600">
                                Tempo: {currentTime.toFixed(1)}s
                                {totalCoordinates > 0 && (
                                    <span className="ml-2 text-sm text-gray-500">
                                        (Ponto {currentCoordinateIndex + 1} de {totalCoordinates})
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Container para a área de gravação */}
                    <div 
                        className="mx-auto border-2 border-gray-300 bg-black rounded-lg overflow-hidden"
                        style={{
                            width: `${canvasSize.width}px`,
                            height: `${canvasSize.height}px`,
                            position: 'relative'
                        }}
                    >
                        {/* Mídia de fundo (vídeo ou imagem) */}
                        {mediaType === 1 && mediaUrl ? (
                            <video
                                ref={videoRef}
                                src={mediaUrl}
                                muted
                                playsInline
                                preload="auto"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                    console.error('Video error:', e.target.error);
                                    const error = e.target.error;
                                    if (error) {
                                        console.error('Error code:', error.code);
                                        console.error('Error message:', error.message);
                                        
                                        // Se for erro de range request, tentar recarregar com URL direta
                                        if (error.code === 3) { // MEDIA_ERR_DECODE
                                            // Força reload do componente ou tenta nova estratégia
                                        }
                                    }
                                }}
                            />
                        ) : mediaType === 0 && mediaUrl ? (
                            <img
                                src={mediaUrl}
                                alt="Test media"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={() => console.error('Error loading image')}
                            />
                        ) : null}

                        {/* Container do heatmap sobreposto */}
                        <div
                            ref={heatmapContainerRef}
                            className="absolute inset-0 pointer-events-none z-10"
                        ></div>
                    </div>
                </div>

                {/* Canvas para gravação (sempre renderizado mas invisível) */}
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="absolute pointer-events-none"
                    style={{ 
                        top: '-9999px',
                        left: '-9999px'
                    }}
                ></canvas>

                {/* Player do vídeo renderizado - aparece quando a gravação termina */}
                {downloadLink && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                Gravação Concluída!
                            </h2>
                            <div className="max-w-3xl mx-auto">
                                <video 
                                    src={downloadLink} 
                                    controls 
                                    className="w-full rounded-lg shadow-lg"
                                    preload="auto"
                                    playsInline
                                    muted
                                    onError={(e) => {
                                        console.error('❌ Erro no vídeo de reprodução:', e.target.error);
                                        // Não tenta recriar automaticamente para evitar loops
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoHeatmap;