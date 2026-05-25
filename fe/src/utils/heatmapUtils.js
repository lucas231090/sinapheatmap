/**
 * Heatmap Utilities
 */

export const transformToCoordinates = (xValues, yValues) => {
  if (!xValues || !yValues) {
    return [];
  }
  const xArray = xValues.split(";").map(Number);
  const yArray = yValues.split(";").map(Number);

  if (xArray.length !== yArray.length) {
    throw new Error("X and Y arrays must have the same length");
  }

  return xArray.map((x, index) => ({
    x: x,
    y: yArray[index],
  }));
};

export const validateCoordinates = (coords) => {
  if (!Array.isArray(coords)) {
    return [];
  }

  return coords.filter((coord) => {
    const isValid =
      coord &&
      typeof coord.x === "number" &&
      !isNaN(coord.x) &&
      typeof coord.y === "number" &&
      !isNaN(coord.y);
    return isValid;
  });
};

export const scaleCoordinates = (coords, scale) => {
  if (!Array.isArray(coords) || !scale || scale <= 0) {
    return [];
  }

  return coords.map((coord) => ({
    x: Math.round(coord.x * scale),
    y: Math.round(coord.y * scale),
    value: 50, // Default value for heatmap
  }));
};

export const interpolateCoordinates = (coords, maxDistance = 30) => {
  if (!Array.isArray(coords) || coords.length < 2) return coords;

  const interpolated = [];
  interpolated.push(coords[0]);

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];

    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const distance = Math.hypot(dx, dy);

    if (distance > maxDistance) {
      const steps = Math.floor(distance / maxDistance);
      for (let j = 1; j <= steps; j++) {
        const factor = j / (steps + 1);
        const newCoord = {
          x: Math.round(prev.x + dx * factor),
          y: Math.round(prev.y + dy * factor),
          value: prev.value || 50,
        };
        // Preserva o timestamp se existir, calculando proporcionalmente
        if (prev.timestamp !== undefined && curr.timestamp !== undefined) {
          newCoord.timestamp = prev.timestamp + (curr.timestamp - prev.timestamp) * factor;
        }
        interpolated.push(newCoord);
      }
    }
    interpolated.push(curr);
  }
  return interpolated;
};

export const calculateResponsiveScale = (
  originalWidth,
  originalHeight,
  windowSize,
) => {
  if (!originalWidth || !originalHeight) return 1;

  const availableWidth = windowSize.width;
  const availableHeight = windowSize.height;

  const widthScale = availableWidth / originalWidth;
  const heightScale = availableHeight / originalHeight;

  const scale = Math.min(widthScale, heightScale, 1);
  return Math.max(0.1, Math.min(scale, 2));
};

export const calculateCanvasSize = (
  originalWidth,
  originalHeight,
  scale = 1,
) => {
  const width = parseFloat(originalWidth) || 1280;
  const height = parseFloat(originalHeight) || 720;

  if (isNaN(scale) || scale <= 0 || scale > 10) {
    scale = 1.0;
  }

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

export const calculateContainLayout = (
  containerWidth,
  containerHeight,
  mediaWidth,
  mediaHeight,
) => {
  const safeContainerWidth = Number(containerWidth) || 0;
  const safeContainerHeight = Number(containerHeight) || 0;
  const safeMediaWidth = Number(mediaWidth) || 0;
  const safeMediaHeight = Number(mediaHeight) || 0;

  if (
    safeContainerWidth <= 0 ||
    safeContainerHeight <= 0 ||
    safeMediaWidth <= 0 ||
    safeMediaHeight <= 0
  ) {
    return {
      width: safeContainerWidth,
      height: safeContainerHeight,
      left: 0,
      top: 0,
    };
  }

  const scale = Math.min(
    safeContainerWidth / safeMediaWidth,
    safeContainerHeight / safeMediaHeight,
  );

  const width = safeMediaWidth * scale;
  const height = safeMediaHeight * scale;

  return {
    width,
    height,
    left: (safeContainerWidth - width) / 2,
    top: (safeContainerHeight - height) / 2,
  };
};

export const downloadHeatMapImage = ({
  heatmapCanvasRef,
  canvasRef,
  imgRef,
  canvasSize,
  heatmapVisible,
  canvasVisible,
  fileName,
}) => {
  if (!heatmapCanvasRef?.current || !imgRef?.current || !canvasSize?.width) {
    console.error("Referências necessárias não encontradas para download");
    return;
  }

  try {
    const overlayCanvas = document.querySelectorAll(".heatmap-canvas")[0];
    const mediaElement = imgRef.current;
    const mediaWidth =
      mediaElement?.naturalWidth ||
      mediaElement?.videoWidth ||
      canvasSize.width;
    const mediaHeight =
      mediaElement?.naturalHeight ||
      mediaElement?.videoHeight ||
      canvasSize.height;
    const containLayout = calculateContainLayout(
      canvasSize.width,
      canvasSize.height,
      mediaWidth,
      mediaHeight,
    );

    const finalCanvas = document.createElement("canvas");
    const finalContext = finalCanvas.getContext("2d");

    finalCanvas.width = canvasSize.width;
    finalCanvas.height = canvasSize.height;

    if (imgRef.current && heatmapVisible) {
      finalContext.drawImage(
        imgRef.current,
        containLayout.left,
        containLayout.top,
        containLayout.width,
        containLayout.height,
      );
    }

    if (overlayCanvas && heatmapVisible) {
      finalContext.drawImage(overlayCanvas, 0, 0);
    }

    if (canvasRef?.current && canvasVisible) {
      finalContext.drawImage(canvasRef.current, 0, 0);
    }

    const dataURL = finalCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `Heatmap-${fileName || "export"}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erro ao gerar download do heatmap:", error);
  }
};
