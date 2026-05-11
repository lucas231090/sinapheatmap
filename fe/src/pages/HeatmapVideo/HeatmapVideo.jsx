import { useParams } from "react-router-dom";
import { Player } from "@remotion/player";
import { useState, useRef } from "react";
import { HeatmapComposition } from "@/components/Heatmap/HeatmapComposition";
import VideoControls from "@/components/Heatmap/VideoControls";
import useHeatmapVideoLogic from "@/hooks/useHeatmapVideoLogic";

/**
 * Página de Vídeo Heatmap
 * Componente responsável apenas pela apresentação da interface de vídeo
 * Toda a lógica está separada no hook useHeatmapVideoLogic
 */
const HeatmapVideo = () => {
  // Setup MediaRecorder refs and state
  const mediaRecorderRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { id } = useParams();

  // Hook centralizado para toda a lógica do vídeo
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
    mediaType,
    img,
    width,
    height,
    totalFrames,
    hasValidData,
    heatmapData,
    isLoading,
    error,
    hasSingleTest,
    shouldShowSelector,
    currentTestIndex,
    selectedTestIndex,
    handleTestSelect,
    handleVideoStart,
  } = useHeatmapVideoLogic(id);

  // Handler to record and download video
  const handleDownloadVideo = () => {
    if (!playerRef.current) return;
    setIsDownloading(true);
    // get internal player or component instance
    let videoElem =
      playerRef.current.getInternalPlayer?.() || playerRef.current;
    videoElem.seekTo(0); // Reset video to start

    // prepare media stream and cleanup
    let stream;
    let cleanup;
    // If player video stream available, use it
    if (typeof videoElem.captureStream === "function") {
      stream = videoElem.captureStream();
    } else {
      const canvasElem = document.querySelector("canvas.heatmap-canvas");
      const gazeElem = document.querySelector("canvas.gaze-canvas");

      if (mediaType === 1) {
        const videoTag = document.querySelector("video");
        if (!videoTag || typeof videoTag.captureStream !== "function") {
          console.error(
            "Cannot record: video element not found or captureStream unsupported",
          );
          return;
        }
        const combined = document.createElement("canvas");
        combined.width = canvasElem.width;
        combined.height = canvasElem.height;
        const ctx = combined.getContext("2d");
        stream = combined.captureStream(30);
        // draw loop combining background, heatmap, and gaze layers
        const interval = setInterval(() => {
          ctx.clearRect(0, 0, combined.width, combined.height);
          ctx.drawImage(videoTag, 0, 0, combined.width, combined.height);
          ctx.drawImage(canvasElem, 0, 0, combined.width, combined.height);
          if (gazeElem) {
            ctx.drawImage(gazeElem, 0, 0, combined.width, combined.height);
          }
        }, 1000 / 30);
        cleanup = () => clearInterval(interval);
      } else {
        const imgElem = document.querySelector('img[alt="Heatmap background"]');
        const combined = document.createElement("canvas");
        combined.width = canvasElem.width;
        combined.height = canvasElem.height;
        const ctx = combined.getContext("2d");
        stream = combined.captureStream(30);
        // draw loop combining background, heatmap, and gaze layers
        const interval = setInterval(() => {
          ctx.clearRect(0, 0, combined.width, combined.height);
          ctx.drawImage(imgElem, 0, 0, combined.width, combined.height);
          ctx.drawImage(canvasElem, 0, 0, combined.width, combined.height);
          if (gazeElem) {
            ctx.drawImage(gazeElem, 0, 0, combined.width, combined.height);
          }
        }, 1000 / 30);
        cleanup = () => clearInterval(interval);
      }
    }
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      if (cleanup) cleanup();
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}-heatmap.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsDownloading(false);
    };
    recorder.start();
    // start playback and stop recording on video end
    videoElem.play();
    const stopRecording = () => {
      if (recorder.state === "recording") recorder.stop();
    };
    // attach ended event if available
    if (videoElem.addEventListener) {
      videoElem.addEventListener("ended", stopRecording);
      // cleanup listener when recorder stops
      recorder.onstop = () => {
        if (cleanup) cleanup();
        videoElem.removeEventListener("ended", stopRecording);
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}-heatmap.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      };
    }
    mediaRecorderRef.current = recorder;
  };

  // Exibe loading se estiver carregando
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Carregando dados do vídeo...</div>
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

  return (
    <div className="flex flex-col items-start md:items-center p-4 overflow-x-auto">
      <div className="flex flex-row">
        <div className="bg-card dark:bg-darkcard p-6 rounded-lg flex flex-col items-center">
          <p className="mb-2 text-3xl text-title dark:text-darktitle">
            <strong>Eyetracking Heatmap:</strong> {fileName || "No ID provided"}
          </p>

          {/* Controles do vídeo */}
          <VideoControls
            playerRef={playerRef}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            duration={totalFrames}
            dataFile={dataFile}
            selectedTestIndex={selectedTestIndex || ""}
            setSelectedTestIndex={handleTestSelect}
            onVideoStart={handleVideoStart}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            hasSingleTest={hasSingleTest}
            shouldShowSelector={shouldShowSelector}
            currentTestIndex={currentTestIndex}
            onDownloadVideo={handleDownloadVideo}
            downloading={isDownloading}
          />

          <div className="border border-gray-300 rounded shadow-lg pa">
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
                    {currentTestIndex
                      ? "Carregando dados do heatmap..."
                      : hasSingleTest
                      ? "Preparando vídeo..."
                      : "Selecione um teste para começar"}
                  </h3>
                  <p className="text-gray-600">
                    {!hasValidData && currentTestIndex
                      ? "Nenhum dado disponível para este teste."
                      : hasSingleTest
                      ? "O vídeo será iniciado automaticamente."
                      : "O vídeo será iniciado automaticamente após a seleção."}
                  </p>
                </div>
              </div>
            ) : (
              // Renderizando o player de vídeo
              // Ele funciona da seguinte maneira:
              // 1. O componente Player é renderizado com a composição HeatmapComposition.
              // 2. O componente HeatmapComposition é responsável por renderizar o heatmap.
              // 3. O playerRef é passado para o componente Player para controle do vídeo.
              // 4. O playerKey é usado para forçar o remount do componente Player quando necessário.
              // 5. O componente Player é configurado para reproduzir o vídeo com as propriedades fornecidas.
              // 6. O componente HeatmapComposition recebe os dados do heatmap e a imagem como props.
              // 7. O vídeo pode ser controlado pelo usuário com os controles fornecidos.
              // 8. O vídeo pode ser reproduzido automaticamente ou pausado com base no estado isPlaying.
              // 9. O vídeo pode ser pausado ou reproduzido com um clique.
              // 10. O vídeo pode ser reproduzido em uma velocidade diferente com base no estado playbackSpeed.
              <Player
                key={playerKey} // Important! This forces a complete remount
                ref={playerRef}
                component={HeatmapComposition}
                durationInFrames={totalFrames}
                fps={30}
                compositionWidth={width}
                compositionHeight={height}
                style={{
                  width: width / 1.9,
                  height: height / 1.9,
                }}
                controls={!isDownloading}
                inputProps={{
                  heatmapData,
                  img,
                  type: mediaType,
                }}
                autoPlay={false}
                clickToPlay={!isDownloading}
                loop={false}
                doubleClickToFullscreen={true}
                playbackRate={playbackSpeed}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                acknowledgeRemotionLicense
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapVideo;
