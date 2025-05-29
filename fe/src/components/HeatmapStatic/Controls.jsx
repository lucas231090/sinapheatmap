import { useControls } from "react-zoom-pan-pinch";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import TestSelector from "@/components/HeatmapStatic/TestSelector";

const Controls = ({
  transformComponentRef,
  heatmapCanvasVisible,
  setHeatmapCanvasVisible,
  canvasVisible,
  setCanvasVisible,
  downloadHeatMap,
  dataFile,
  selectedTestIndex,
  setSelectedTestIndex,
}) => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="flex flex-wrap justify-center items-center w-full mb-4">
      <div className="flex flex-wrap items-center justify-center">
        <button
          className="m-2 bg-indigo-500 hover:bg-indigo-700 text-white p-2 rounded-lg flex items-center gap-2"
          onClick={() => setHeatmapCanvasVisible(!heatmapCanvasVisible)}
        >
          {heatmapCanvasVisible ? "Hide Heatmap" : "Show Heatmap"}
        </button>

        <button
          className="m-2 bg-purple-500 hover:bg-purple-700 text-white p-2 rounded-lg flex items-center gap-2"
          onClick={() => setCanvasVisible(!canvasVisible)}
        >
          {canvasVisible ? "Hide Bubbles" : "Show Bubbles"}
        </button>

        <button
          className="m-2 bg-blue-500 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center gap-2"
          onClick={() => zoomIn()}
        >
          <ZoomInIcon />
          Zoom In
        </button>

        <button
          className="m-2 bg-green-500 hover:bg-green-700 text-white p-2 rounded-lg flex items-center gap-2"
          onClick={() => zoomOut()}
        >
          <ZoomOutIcon />
          Zoom Out
        </button>

        <button
          className="m-2 bg-yellow-500 hover:bg-yellow-700 text-white p-2 rounded-lg flex items-center gap-2"
          onClick={() => resetTransform()}
        >
          <RefreshIcon />
          Reset
        </button>

        <button
          className="m-2 bg-gray-500 hover:bg-gray-700 text-white p-2 rounded-lg flex items-center gap-2"
          onClick={() => downloadHeatMap()}
        >
          <DownloadIcon />
          Download
        </button>
        <div className="flex flex-row items-center justify-center">
          <TestSelector
            dataFile={dataFile}
            selectedTestIndex={selectedTestIndex}
            setSelectedTestIndex={setSelectedTestIndex}
          />
        </div>
      </div>
    </div>
  );
};

export default Controls;
