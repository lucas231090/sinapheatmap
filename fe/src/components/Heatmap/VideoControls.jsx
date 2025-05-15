import React from "react";
import { useEffect, useState } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SpeedIcon from "@mui/icons-material/Speed";

import TestSelector from "../../components/Heatmap/TestSelector";

/**
 * Componente que gerencia os controles do vídeo de heatmap
 */
const VideoControls = ({
  playerRef,
  isPlaying,
  setIsPlaying,
  duration,
  dataFile,
  selectedTestIndex,
  setSelectedTestIndex,
  onVideoStart,
  playbackSpeed,
  setPlaybackSpeed,
}) => {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (selectedTestIndex !== null && selectedTestIndex !== "" && !hasStarted) {
      onVideoStart();
      setHasStarted(true);
    }
  }, [selectedTestIndex, hasStarted, onVideoStart]);

  // Manipula mudança de velocidade
  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setPlaybackSpeed(newSpeed);

    if (playerRef.current) {
      // Se a reprodução estiver em andamento, aplica a nova velocidade
      if (isPlaying) {
        playerRef.current.pause();
        setTimeout(() => {
          playerRef.current.play();
        }, 50);
      }
    }
  };

  return (
    <div className="flex flex-wrap justify-center items-center w-full mb-4">
      <div className="flex flex-wrap items-center justify-center">
        <div className="m-2">
          <TestSelector
            dataFile={dataFile}
            selectedTestIndex={selectedTestIndex}
            setSelectedTestIndex={setSelectedTestIndex}
          />
        </div>
      </div>
      <div className="m-2 p-2 border rounded-md bg-white dark:bg-gray-800">
        <label className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
          <SpeedIcon className="mr-1" fontSize="small" />
          Velocidade:
        </label>
        <select
          value={playbackSpeed}
          onChange={handleSpeedChange}
          className="p-2 border rounded bg-inputtext dark:bg-darkinputtext text-title dark:text-darktitle"
        >
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="1">1x (Normal)</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
          <option value="4">4x</option>
        </select>
      </div>
    </div>
  );
};

export default VideoControls;
