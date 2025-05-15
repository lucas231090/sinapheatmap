import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Player } from "@remotion/player";
import { HeatmapComposition } from "../../components/Heatmap/HeatmapComposition";
import VideoControls from "../../components/Heatmap/VideoControls";
import useHeatmapVideo from "../../hooks/useHeatmapVideo";
import axios from "axios"; // Make sure axios is installed
import config from "../../../config"; // For API_BASE_URL

const HeatmapVideo = () => {
  const { id } = useParams();
  const [selectedTestIndex, setSelectedTestIndex] = useState("");
  const [downloadStatus, setDownloadStatus] = useState(null); // null, 'requesting', 'processing', 'ready', 'error'
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Usando nosso hook personalizado para gerenciar o estado e comportamento do vídeo
  const {
    playerRef,
    isPlaying,
    setIsPlaying,
    showPlayer,
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
    handleVideoStart,
  } = useHeatmapVideo(id, selectedTestIndex);

  // Handler para seleção de teste
  const onTestSelect = (newTestIndex) => {
    const updatedTestIndex = handleTestSelect(newTestIndex);
    setSelectedTestIndex(updatedTestIndex);
  };

  // Handler for video download
  const handleDownloadVideo = async () => {
    if (!id || !selectedTestIndex || !hasValidData) return;
    
    try {
      setDownloadStatus('requesting');
      
      // Request the server to render the video
      const response = await axios.post(`${config.API_BASE_URL}/api/videos/render`, {
        fileId: id,
        testIndex: selectedTestIndex,
        fps: 30,
        duration: totalFrames,
        width: width,
        height: height,
        playbackSpeed: playbackSpeed
      });
      
      if (response.data.status === 'processing') {
        // Video rendering started on the server
        setDownloadStatus('processing');
        
        // Poll for completion
        const checkStatus = async () => {
          try {
            const statusResponse = await axios.get(
              `${config.API_BASE_URL}/api/videos/status/${response.data.jobId}`
            );
            
            if (statusResponse.data.status === 'complete') {
              setDownloadStatus('ready');
              setDownloadUrl(statusResponse.data.downloadUrl);
              
              // Automatically download
              const a = document.createElement('a');
              a.href = statusResponse.data.downloadUrl;
              a.download = `heatmap-${fileName}-test-${selectedTestIndex}.mp4`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              
            } else if (statusResponse.data.status === 'processing') {
              // Check again in a few seconds
              setTimeout(checkStatus, 3000);
            } else {
              // Error or other status
              setDownloadStatus('error');
            }
          } catch (err) {
            console.error("Error checking render status:", err);
            setDownloadStatus('error');
          }
        };
        
        // Start polling
        setTimeout(checkStatus, 3000);
      } else if (response.data.status === 'error') {
        setDownloadStatus('error');
      }
    } catch (err) {
      console.error("Error requesting video render:", err);
      setDownloadStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-start md:items-center p-4 overflow-x-auto">
      <div className="flex flex-row">
        <div className="bg-card dark:bg-darkcard p-4 rounded-lg flex flex-col items-center">
          <p className="mb-2 text-3xl text-title dark:text-darktitle">
            <strong>Eyetracking Heatmap:</strong> {fileName || "No ID provided"}
          </p>

          <VideoControls
            playerRef={playerRef}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            duration={totalFrames}
            dataFile={dataFile}
            selectedTestIndex={selectedTestIndex || ""}
            setSelectedTestIndex={onTestSelect}
            onVideoStart={handleVideoStart}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            onDownloadVideo={handleDownloadVideo}
          />

          {/* Download status indicators */}
          {downloadStatus === 'requesting' && (
            <div className="w-full mb-3 p-2 bg-blue-100 text-blue-800 rounded text-center">
              Iniciando renderização do vídeo...
            </div>
          )}
          
          {downloadStatus === 'processing' && (
            <div className="w-full mb-3 p-2 bg-yellow-100 text-yellow-800 rounded text-center">
              Renderizando vídeo no servidor. Isto pode levar alguns minutos...
            </div>
          )}
          
          {downloadStatus === 'ready' && (
            <div className="w-full mb-3 p-2 bg-green-100 text-green-800 rounded text-center">
              Vídeo pronto! 
              <a href={downloadUrl} download className="ml-2 underline">
                Clique aqui se o download não iniciar automaticamente
              </a>
            </div>
          )}
          
          {downloadStatus === 'error' && (
            <div className="w-full mb-3 p-2 bg-red-100 text-red-800 rounded text-center">
              Erro ao renderizar o vídeo. Por favor tente novamente.
            </div>
          )}

          <div className="border border-gray-300 rounded shadow-lg">
            {!showPlayer || !hasValidData ? (
              <div
                style={{
                  width: width / 2,
                  height: height / 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <div className="text-center p-8">
                  <h3 className="text-xl mb-4">
                    {selectedTestIndex
                      ? "Carregando dados do heatmap..."
                      : "Selecione um teste para começar"}
                  </h3>
                  <p className="text-gray-600">
                    {!hasValidData && selectedTestIndex
                      ? "Nenhum dado disponível para este teste."
                      : "O vídeo será iniciado automaticamente após a seleção."}
                  </p>
                </div>
              </div>
            ) : (
              <Player
                key={playerKey} // Important! This forces a complete remount
                ref={playerRef}
                component={HeatmapComposition}
                durationInFrames={totalFrames}
                fps={30}
                compositionWidth={width}
                compositionHeight={height}
                style={{
                  width,
                  height,
                }}
                controls
                inputProps={{
                  heatmapData,
                  img,
                }}
                autoPlay={false}
                clickToPlay={true}
                doubleClickToFullscreen={true}
                playbackRate={playbackSpeed}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapVideo;
