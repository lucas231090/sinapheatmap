import { useEffect, useState } from "react";
import SpeedIcon from "@mui/icons-material/Speed";
import DownloadIcon from "@mui/icons-material/Download";

import TestSelector from "@/components/HeatmapStatic/TestSelector";

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
  onDownloadVideo,
  hasSingleTest = false,
  shouldShowSelector = true,
  currentTestIndex = "",
  downloading,
}) => {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (currentTestIndex !== null && currentTestIndex !== "" && !hasStarted) {
      onVideoStart();
      setHasStarted(true);
    }
  }, [currentTestIndex, hasStarted, onVideoStart]);

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
        {shouldShowSelector ? (
          <div className="m-2">
            <TestSelector
              dataFile={dataFile}
              selectedTestIndex={selectedTestIndex}
              setSelectedTestIndex={setSelectedTestIndex}
            />
          </div>
        ) : null}
      </div>
      <div className="m-2 p-2 border rounded-md bg-white dark:bg-gray-800">
        <label className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
          <SpeedIcon className="mr-1" fontSize="small" />
          Velocidade:
        </label>
        <select
          value={playbackSpeed}
          onChange={handleSpeedChange}
          disabled={downloading}
          className={`p-2 border rounded  ${
            downloading
              ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-inputtext dark:bg-darkinputtext text-title dark:text-darktitle"
          }`}
        >
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="1">1x (Normal)</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
          <option value="4">4x</option>
        </select>
      </div>
      <div className="m-2">
        <button
          onClick={onDownloadVideo}
          disabled={!currentTestIndex || !hasStarted || downloading}
          className="flex items-center p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download heatmap video"
        >
          <DownloadIcon className="mr-1" fontSize="small" />
          Download Video
        </button>
      </div>
    </div>
  );
};

export default VideoControls;
