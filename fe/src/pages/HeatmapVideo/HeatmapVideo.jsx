import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Player } from "@remotion/player";
import { HeatmapComposition } from "../../remotion/HeatmapComposition";
import VideoControls from "./components/VideoControls";
import useHeatmapData from "../HeatmapStatic/hooks/useHeatmapData";

const HeatmapVideo = () => {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playerKey, setPlayerKey] = useState(0); // New state to force player remount
  const playerRef = useRef(null);
  const canvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);
  const imgRef = useRef(null);

  // State variables
  const [selectedTestIndex, setSelectedTestIndex] = useState("");
  const [heatmapCanvasVisible] = useState(true);
  const [canvasVisible] = useState(false);

  // Handler for test selection
  const handleTestSelect = (newTestIndex) => {
    // Only proceed if the test is actually changing
    if (newTestIndex !== selectedTestIndex) {
      // Hide the current player
      setShowPlayer(false);
      setIsPlaying(false);

      // Update the test index
      setSelectedTestIndex(newTestIndex);

      // Set a timeout to create a new player
      setTimeout(() => {
        // Increment key to force remount
        setPlayerKey((prevKey) => prevKey + 1);
        // Show the new player
        setShowPlayer(true);
      }, 100);
    }
  };

  // Use the same hook as HeatmapStatic to get data
  const { fileName, dataFile, img, coords, canvasSize, radiusScale } =
    useHeatmapData(
      id,
      selectedTestIndex,
      canvasRef,
      heatmapCanvasRef,
      imgRef,
      heatmapCanvasVisible,
      canvasVisible
    );

  // Handle video start
  const handleVideoStart = () => {
    if (!showPlayer) {
      setShowPlayer(true);
    }

    // Use requestAnimationFrame for smoother playback start
    requestAnimationFrame(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
        setIsPlaying(true);
      }
    });
  };

  // Verify we have valid data
  const hasValidData =
    coords &&
    coords.length > 0 &&
    canvasSize.width > 0 &&
    canvasSize.height > 0;

  // Parse dimensions with fallbacks
  const width = parseInt(canvasSize.width, 10) || 1280;
  const height = parseInt(canvasSize.height, 10) || 720;

  // Calculate frames needed
  const FRAMES_PER_POINT = 10;
  const totalFrames = hasValidData
    ? coords.length * FRAMES_PER_POINT + 60
    : 150;

  // Prepare heatmap data
  const heatmapData = {
    coords: coords || [],
    radiusScale: radiusScale || 1,
    canvasSize: {
      width: width,
      height: height,
    },
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
            setSelectedTestIndex={handleTestSelect} // Use our custom handler
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
