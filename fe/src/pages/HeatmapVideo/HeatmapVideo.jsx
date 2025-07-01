import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useHeatmapVideoLogic from '@/hooks/useHeatmapVideoLogic';
import './HeatVideo.css';

const VideoHeatmap = () => {
    const { id } = useParams();
    
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
        
        // Funções
        handlePlayClick,
        stopRecording,
        updateHeatmapBasedOnTime,
        drawFrame,
    } = useHeatmapVideoLogic(id);

    // Configurar event listeners para vídeo se for mídia de vídeo
    useEffect(() => {
        const video = videoRef.current;
        if (!video || mediaType !== 1) return;

        const handleTimeUpdate = () => updateHeatmapBasedOnTime();
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

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);

        if (isRecording && mediaType === 1) {
            drawFrame();
        }

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
        };
    }, [isRecording, mediaType, updateHeatmapBasedOnTime, stopRecording, drawFrame, totalCoordinates]);

    // Exibe loading se estiver carregando
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl">Carregando dados do teste...</div>
            </div>
        );
    }

    // Exibe erro se houver
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl text-red-500">Erro: {error}</div>
            </div>
        );
    }

    // Se não há ID, exibe mensagem
    if (!id) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl">Nenhum ID de teste fornecido</div>
            </div>
        );
    }

    return (
        <div className='body-video'>
            {/* Container para a área de gravação */}
            <div 
                style={{
                    position: 'relative',
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    margin: '20px auto',
                    border: '2px solid #ccc',
                    backgroundColor: '#000'
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
                        style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onLoadStart={() => console.log('Video load started')}
                        onLoadedData={() => console.log('Video data loaded')}
                        onCanPlay={() => console.log('Video can play')}
                        onError={(e) => {
                            console.error('Video error:', e.target.error);
                            const error = e.target.error;
                            if (error) {
                                console.error('Error code:', error.code);
                                console.error('Error message:', error.message);
                                
                                // Se for erro de range request, tentar recarregar com URL direta
                                if (error.code === 3) { // MEDIA_ERR_DECODE
                                    console.log('Attempting to reload video with different strategy...');
                                    // Força reload do componente ou tenta nova estratégia
                                }
                            }
                        }}
                    />
                ) : mediaType === 0 && mediaUrl ? (
                    <img
                        src={mediaUrl}
                        alt="Test media"
                        style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onLoad={() => console.log('Image loaded successfully')}
                        onError={() => console.error('Error loading image')}
                    />
                ) : null}

                {/* Container do heatmap sobreposto */}
                <div
                    ref={heatmapContainerRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 10
                    }}
                ></div>

                {/* Canvas para gravação (invisível ao usuário) */}
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    style={{ 
                        position: 'absolute',
                        top: '-9999px',
                        left: '-9999px',
                        pointerEvents: 'none'
                    }}
                ></canvas>
            </div>

            <div className='white-box'>
                {!isRecording ? (
                    <div className='button-box'>
                        <div>
                            <h3>Teste: {fileName}</h3>
                            <p>ID: {id}</p>
                            <p>Coordenadas disponíveis: {totalCoordinates}</p>
                            <p>Tipo de mídia: {mediaType === 1 ? 'Vídeo' : 'Imagem'}</p>
                            <p>Duração estimada: {videoDuration.toFixed(1)}s</p>
                            <p>Status da mídia: {mediaUrl ? 'Carregada' : 'Não carregada'}</p>
                            {mediaUrl && (
                                <>
                                    <p>Tipo URL: {mediaUrl.startsWith('blob:') ? 'Blob URL' : 'Direct URL'}</p>
                                    <p>URL: {mediaUrl.substring(0, 50)}...</p>
                                </>
                            )}
                            <button 
                                className='submit' 
                                onClick={handlePlayClick}
                                disabled={!mediaUrl || totalCoordinates === 0}
                            >
                                {!mediaUrl ? 'Carregando mídia...' : 
                                 totalCoordinates === 0 ? 'Sem coordenadas disponíveis' : 
                                 'Start Recording'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='Video-box'>
                        <div className='button-box'>
                            <button className='loading-btn' disabled>Recording</button>
                        </div>
                        <div>
                            <p>Progresso: {currentCoordinateIndex}/{totalCoordinates} coordenadas</p>
                            <progress id="file" max={videoDuration} value={currentTime}></progress>
                            <p>Tempo: {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s</p>
                        </div>
                    </div>
                )}

                {downloadLink && (
                    <div className='Video-box padding'>
                        <h4>Gravação Concluída!</h4>
                        <a href={downloadLink} download={`heatmap-${fileName}.webm`}>
                            Download Recording
                        </a>
                        <video 
                            src={downloadLink} 
                            controls 
                            style={{ maxWidth: '100%', marginTop: '10px' }}
                            preload="auto"
                            playsInline
                            muted
                            onError={(e) => {
                                console.error('❌ Erro no vídeo de reprodução:', e.target.error);
                                console.log('🔄 Tentando recriar blob URL...');
                                // Não tenta recriar automaticamente para evitar loops
                            }}
                            onLoadStart={() => console.log('📺 Video playback load started')}
                            onCanPlay={() => console.log('📺 Video playback can play')}
                        ></video>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoHeatmap;