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
    ...coord,
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
          newCoord.timestamp =
            prev.timestamp + (curr.timestamp - prev.timestamp) * factor;
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

/**
 * High-contrast color palette for distinguishing sessions / participants.
 * Each entry is [fill, stroke] where fill is semi-transparent and stroke is opaque.
 */
export const SESSION_COLORS = [
  { fill: "rgba(255, 99, 132, 0.55)", stroke: "#FF6384", label: "#FF6384" },
  { fill: "rgba(54, 162, 235, 0.55)", stroke: "#36A2EB", label: "#36A2EB" },
  { fill: "rgba(255, 206, 86, 0.55)", stroke: "#FFCE56", label: "#FFCE56" },
  { fill: "rgba(75, 192, 192, 0.55)", stroke: "#4BC0C0", label: "#4BC0C0" },
  { fill: "rgba(153, 102, 255, 0.55)", stroke: "#9966FF", label: "#9966FF" },
  { fill: "rgba(255, 159, 64, 0.55)", stroke: "#FF9F40", label: "#FF9F40" },
  { fill: "rgba(46, 204, 113, 0.55)", stroke: "#2ECC71", label: "#2ECC71" },
  { fill: "rgba(231, 76, 60, 0.55)", stroke: "#E74C3C", label: "#E74C3C" },
  { fill: "rgba(52, 152, 219, 0.55)", stroke: "#3498DB", label: "#3498DB" },
  { fill: "rgba(241, 196, 15, 0.55)", stroke: "#F1C40F", label: "#F1C40F" },
  { fill: "rgba(155, 89, 182, 0.55)", stroke: "#9B59B6", label: "#9B59B6" },
  { fill: "rgba(230, 126, 34, 0.55)", stroke: "#E67E22", label: "#E67E22" },
  { fill: "rgba(26, 188, 156, 0.55)", stroke: "#1ABC9C", label: "#1ABC9C" },
  { fill: "rgba(22, 160, 133, 0.55)", stroke: "#16A085", label: "#16A085" },
  { fill: "rgba(192, 57, 43, 0.55)", stroke: "#C0392B", label: "#C0392B" },
  { fill: "rgba(41, 128, 185, 0.55)", stroke: "#2980B9", label: "#2980B9" },
];

/**
 * Creates a custom gradient configuration for heatmap.js based on a session color.
 */
export const createColorGradient = (colorObj) => {
  if (!colorObj) return null;
  return {
    0.2: "rgba(255, 255, 255, 0)",
    0.6: colorObj.fill,
    1.0: colorObj.stroke,
  };
};

/**
 * Compute fixations from raw gaze coordinates using I-DT
 * (Identification by Dispersion Threshold) algorithm.
 *
 * @param {Array} coords - Array of {x, y, timestamp} objects
 * @param {Object} options
 * @param {number} options.spatialThreshold - Max dispersion (px) to still count as same fixation
 * @param {number} options.minDurationMs    - Minimum duration (ms) to count as a fixation
 * @returns {Array} Fixations: [{id, x, y, durationMs, startTime, endTime, pointCount}]
 */
export const computeFixations = (
  coords,
  { spatialThreshold = 50, minDurationMs = 80 } = {},
) => {
  if (!Array.isArray(coords) || coords.length < 2) return [];

  // Ensure timestamps exist
  const points = coords.map((c, i) => ({
    x: Number(c.x),
    y: Number(c.y),
    timestamp: Number.isFinite(Number(c.timestamp))
      ? Number(c.timestamp)
      : i * (1000 / 60),
  }));

  const fixations = [];
  let windowStart = 0;

  while (windowStart < points.length) {
    let windowEnd = windowStart + 1;

    // Expand window while dispersion is within threshold
    while (windowEnd < points.length) {
      const window = points.slice(windowStart, windowEnd + 1);
      const xs = window.map((p) => p.x);
      const ys = window.map((p) => p.y);
      const dispersionX = Math.max(...xs) - Math.min(...xs);
      const dispersionY = Math.max(...ys) - Math.min(...ys);
      const dispersion = Math.max(dispersionX, dispersionY);

      if (dispersion > spatialThreshold) break;
      windowEnd++;
    }

    // The fixation window is [windowStart, windowEnd - 1]
    const fixationPoints = points.slice(windowStart, windowEnd);
    const startTime = fixationPoints[0].timestamp;
    const endTime = fixationPoints[fixationPoints.length - 1].timestamp;
    const durationMs = endTime - startTime;

    if (durationMs >= minDurationMs && fixationPoints.length >= 2) {
      const centroidX =
        fixationPoints.reduce((sum, p) => sum + p.x, 0) / fixationPoints.length;
      const centroidY =
        fixationPoints.reduce((sum, p) => sum + p.y, 0) / fixationPoints.length;

      fixations.push({
        id: fixations.length,
        x: Math.round(centroidX),
        y: Math.round(centroidY),
        durationMs: Math.round(durationMs),
        startTime,
        endTime,
        pointCount: fixationPoints.length,
      });
    }

    // Advance: if window didn't grow, skip one point to avoid infinite loop
    windowStart = windowEnd > windowStart + 1 ? windowEnd : windowStart + 1;
  }

  return fixations;
};

// Function to calculate perpendicular distance from a point to a line
const getPerpendicularDistance = (point, lineStart, lineEnd) => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag > 0) {
    const dxNorm = dx / mag;
    const dyNorm = dy / mag;
    const px = point.x - lineStart.x;
    const py = point.y - lineStart.y;
    return Math.abs(px * dyNorm - py * dxNorm);
  }

  const distStart = Math.sqrt(
    Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2),
  );
  return distStart;
};

// Recursive Ramer-Douglas-Peucker simplification
const simplifyRDP = (points, epsilon) => {
  if (points.length < 3) return points;

  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = getPerpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDistance) {
      index = i;
      maxDistance = d;
    }
  }

  if (maxDistance > epsilon) {
    const left = simplifyRDP(points.slice(0, index + 1), epsilon);
    const right = simplifyRDP(points.slice(index), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [points[0], points[end]];
  }
};

/**
 * Simplifies a coordinate path (for bubbles/saccades) to reduce clutter
 * while preserving the geometric shape of the gaze path.
 *
 * @param {Array} coords - Raw coordinate array [{x, y, timestamp}, ...]
 * @param {number} epsilon - Distance threshold (px)
 */
export const simplifyPath = (coords, epsilon = 20) => {
  if (!coords || coords.length < 3) return coords;
  return simplifyRDP(coords, epsilon);
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
    const overlayCanvases = document.querySelectorAll(".heatmap-canvas");
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

    if (heatmapVisible) {
      overlayCanvases.forEach((canvas) => {
        finalContext.drawImage(canvas, 0, 0);
      });
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
