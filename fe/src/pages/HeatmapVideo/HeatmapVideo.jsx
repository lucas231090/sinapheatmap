import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Player } from "@remotion/player";
import { HeatmapComposition } from "../../components/Heatmap/HeatmapComposition";
import VideoControls from "../../components/Heatmap/VideoControls";
import useHeatmapVideo from "../../hooks/useHeatmapVideo";

const HeatmapVideo = () => {
  const { id } = useParams();
  const [selectedTestIndex, setSelectedTestIndex] = useState("");

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
          />

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
