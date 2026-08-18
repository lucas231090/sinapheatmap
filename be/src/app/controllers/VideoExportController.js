const path = require("path");
const fs = require("fs");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const webpackOverride = require("../../remotion/webpackOverride");

// Singleton do bundler para não recompilar a cada requisição (cache = true por padrão)
let bundledPromise = null;

class VideoExportController {
  async export(req, res) {
    try {
      const {
        coords,
        coordsBySession,
        canvasSize,
        radiusScale,
        mediaUrl,
        exposureSeconds,
        captureFps,
        durationMs,
        selectedSessionId,
        heatmapVisible,
        bubblesVisible,
        gazePlotVisible,
      } = req.body;

      if (!coords || !canvasSize) {
        return res.status(400).json({ error: "Parâmetros de rastreamento inválidos." });
      }

      const FPS = 60;
      
      const parsedExposureSeconds = Number.parseFloat(exposureSeconds) > 0 ? Number.parseFloat(exposureSeconds) : 10;
      const parsedDurationMs = Number(durationMs);
      const effectiveDurationMs =
        Number.isFinite(parsedDurationMs) && parsedDurationMs > 0
          ? parsedDurationMs
          : parsedExposureSeconds * 1000;

      const totalFrames = Math.max(
        Math.ceil((effectiveDurationMs / 1000) * FPS) + FPS,
        150
      );

      const width = parseInt(canvasSize.width, 10) || 1280;
      const height = parseInt(canvasSize.height, 10) || 720;

      const heatmapData = {
        coords,
        radiusScale: radiusScale || 1,
        canvasSize: { width, height },
        exposureSeconds: parsedExposureSeconds,
        durationMs: effectiveDurationMs,
        captureFps: captureFps || FPS,
      };

      const isVideoFile = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl || "");
      const mediaType = isVideoFile ? 1 : 0;

      const inputProps = {
        heatmapData,
        img: mediaUrl || "",
        type: mediaType,
        modes: {
          heatmap: heatmapVisible ?? true,
          bubbles: bubblesVisible ?? false,
          gazePlot: gazePlotVisible ?? false,
        },
        coordsBySession: coordsBySession || [],
        selectedSessionId: selectedSessionId || "all",
      };

      // Inicia ou reaproveita a compilação do Remotion
      if (!bundledPromise) {
        console.log("[Remotion] Iniciando Webpack bundle...");
        bundledPromise = bundle({
          entryPoint: path.resolve(__dirname, "../../remotion/index.jsx"),
          webpackOverride: webpackOverride,
        });
      }

      const bundleLocation = await bundledPromise;

      console.log("[Remotion] Bundle concluído. Selecionando composição...");
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: "HeatmapExport",
        inputProps,
        browserExecutable: "/usr/bin/chromium-browser",
        chromiumOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        },
      });

      // Cria diretório temporário para a saída
      const outputDir = path.resolve(__dirname, "../../../../uploads/videos");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileName = `export-${Date.now()}.mp4`;
      const outputLocation = path.join(outputDir, fileName);

      console.log(`[Remotion] Renderizando mídia: ${outputLocation} (Frames: ${totalFrames})`);

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation,
        inputProps,
        browserExecutable: "/usr/bin/chromium-browser",
        chromiumOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        },
      });

      console.log("[Remotion] Renderização concluída com sucesso.");

      // Serve o arquivo renderizado
      res.download(outputLocation, fileName, (err) => {
        if (err) {
          console.error("Erro ao fazer o download do arquivo:", err);
        }
        // Remove arquivo após download
        fs.unlink(outputLocation, () => {});
      });

    } catch (error) {
      console.error("[Remotion] Erro durante a exportação:", error);
      res.status(500).json({ error: "Falha na renderização do vídeo.", details: error.message });
    }
  }
}

module.exports = new VideoExportController();
