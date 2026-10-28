import { useState, useMemo, useCallback } from "react";
import { simplifyPath } from "@/utils/heatmapUtils";
import {
  createHoverStore,
  getSurfaceHandlers,
  hitTestCircles,
  useHoverLayer,
} from "./hover/hoverStore";
import HoverTooltip from "./hover/HoverTooltip";

const formatTime = (timestamp) => {
  const milliseconds = Number(timestamp);
  if (!Number.isFinite(milliseconds)) return "Tempo indisponível";
  const wholeMilliseconds = Math.max(0, Math.round(milliseconds));
  const minutes = Math.floor(wholeMilliseconds / 60000);
  const seconds = Math.floor((wholeMilliseconds % 60000) / 1000);
  const remainder = wholeMilliseconds % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(remainder).padStart(3, "0")} (${wholeMilliseconds} ms)`;
};

const LAYER_ID = "bubbles";

const BubbleCanvas = ({
  canvasSize,
  coords,
  coordsBySession,
  transformComponentRef,
  zoomScale: providedZoomScale,
  selectedSessionId,
  hoverStore: externalHoverStore,
  interactive = true,
}) => {
  // When no shared store is provided (standalone usage), the SVG itself acts
  // as the hover surface.
  const [ownHoverStore] = useState(createHoverStore);
  const hoverStore = externalHoverStore || ownHoverStore;
  const isStandalone = !externalHoverStore;

  const zoomScale =
    providedZoomScale || transformComponentRef?.current?.state?.scale || 1;
  const baseRadius = 15;
  const radius = Math.max(8, baseRadius / Math.sqrt(zoomScale));
  const fontSize = Math.max(10, 14 / zoomScale);
  const strokeWidth = Math.max(1, 2 / zoomScale);
  const lineWidth = Math.max(0.8, 1.5 / zoomScale);

  const isMultiSession =
    selectedSessionId === "all" &&
    coordsBySession &&
    coordsBySession.length > 1;

  // Build the flat list of bubbles with session color info, maintaining global index
  const bubbles = useMemo(() => {
    if (isMultiSession && coordsBySession) {
      const result = [];
      coordsBySession.forEach((sessionGroup) => {
        const simplified = simplifyPath(sessionGroup.coords, 6);
        simplified.forEach((coord, localIndex) => {
          result.push({
            x: coord.x,
            y: coord.y,
            sessionId: sessionGroup.sessionId,
            participantName: sessionGroup.participantName,
            color: sessionGroup.color,
            localIndex,
            globalIndex: result.length,
            timestamp: coord.timestamp,
          });
        });
      });
      return result;
    }
    // Single session
    const singleSessionGroup = coordsBySession?.[0];
    const defaultColor = singleSessionGroup?.color || {
      fill: "rgba(255, 0, 0, 0.4)",
      stroke: "#FF6384",
      label: "#FF6384",
    };
    const simplified = simplifyPath(coords || [], 6);
    return simplified.map((coord, index) => ({
      x: coord.x,
      y: coord.y,
      sessionId: singleSessionGroup?.sessionId || "single",
      participantName: singleSessionGroup?.participantName || "",
      color: defaultColor,
      localIndex: index,
      globalIndex: index,
      timestamp: coord.timestamp,
    }));
  }, [coords, coordsBySession, isMultiSession]);

  // Group bubbles by session for drawing saccade lines and calculating neighbors
  const sessionGroups = useMemo(() => {
    const groups = {};
    bubbles.forEach((bubble) => {
      if (!groups[bubble.sessionId]) {
        groups[bubble.sessionId] = [];
      }
      groups[bubble.sessionId].push(bubble);
    });
    return groups;
  }, [bubbles]);

  // Reversed for rendering: first bubbles drawn last → appear on top
  const reversedBubbles = useMemo(() => [...bubbles].reverse(), [bubbles]);

  // Hit-test uses the exact same geometry used for rendering. `bubbles` is
  // already in top-to-bottom visual order (index 0 is drawn last / on top).
  const hitTest = useCallback(
    (x, y, unitsPerPixel) =>
      hitTestCircles(bubbles, () => radius, x, y, unitsPerPixel),
    [bubbles, radius],
  );

  const hoveredBubble = useHoverLayer(hoverStore, LAYER_ID, {
    priority: 1,
    hitTest,
    enabled: interactive && bubbles.length > 0,
  });
  const hovered = hoveredBubble !== null ? bubbles[hoveredBubble] : null;

  // Which bubbles to highlight on hover (current + prev + next within same session)
  const highlightedSet = useMemo(() => {
    if (!hovered) return null;

    const sessionBubbles = sessionGroups[hovered.sessionId] || [];
    const posInSession = sessionBubbles.findIndex(
      (b) => b.globalIndex === hovered.globalIndex,
    );

    const highlighted = new Set();
    highlighted.add(hovered.globalIndex);
    if (posInSession > 0) {
      highlighted.add(sessionBubbles[posInSession - 1].globalIndex);
    }
    if (posInSession < sessionBubbles.length - 1) {
      highlighted.add(sessionBubbles[posInSession + 1].globalIndex);
    }
    return highlighted;
  }, [hovered, sessionGroups]);

  // Legend data for multi-session
  const legend = useMemo(() => {
    if (!isMultiSession || !coordsBySession) return [];
    return coordsBySession.map((group) => ({
      sessionId: group.sessionId,
      participantName: group.participantName,
      color: group.color,
      count: group.coords.length,
    }));
  }, [isMultiSession, coordsBySession]);

  const getBubbleOpacity = (globalIndex) => {
    if (highlightedSet === null) return 1;
    return highlightedSet.has(globalIndex) ? 1 : 0.12;
  };

  const getLineOpacity = (fromGlobalIdx, toGlobalIdx) => {
    if (highlightedSet === null) return 0.3;
    if (highlightedSet.has(fromGlobalIdx) && highlightedSet.has(toGlobalIdx)) {
      return 0.9;
    }
    return 0.06;
  };

  const { width: canvasWidth, height: canvasHeight } = canvasSize;
  const surfaceRef = useCallback(
    (element) => {
      if (element) {
        hoverStore.setSurface(element, {
          width: canvasWidth,
          height: canvasHeight,
        });
      }
    },
    [hoverStore, canvasWidth, canvasHeight],
  );
  const surfaceHandlers = useMemo(
    () => getSurfaceHandlers(hoverStore),
    [hoverStore],
  );

  const standaloneSurfaceProps =
    isStandalone && interactive
      ? { ref: surfaceRef, ...surfaceHandlers }
      : {};

  return (
    <div style={{ position: "relative" }}>
      <svg
        {...standaloneSurfaceProps}
        data-testid="bubble-canvas-svg"
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          pointerEvents: isStandalone && interactive ? "all" : "none",
          cursor: hovered ? "pointer" : undefined,
          display: "block",
          opacity: 0.75,
        }}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
      >
        {/* Saccade lines per session */}
        {Object.entries(sessionGroups).map(([sessionId, sessionBubbles]) =>
          sessionBubbles.slice(1).map((bubble, i) => {
            const prev = sessionBubbles[i];
            return (
              <line
                key={`line-${sessionId}-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={bubble.x}
                y2={bubble.y}
                stroke={bubble.color.stroke}
                strokeWidth={lineWidth}
                opacity={getLineOpacity(prev.globalIndex, bubble.globalIndex)}
                style={{ transition: "opacity 200ms ease" }}
              />
            );
          }),
        )}

        {/* Bubbles in reverse order so first ones render on top */}
        {reversedBubbles.map((bubble) => {
          const opacity = getBubbleOpacity(bubble.globalIndex);
          return (
            <g
              key={`bubble-${bubble.globalIndex}`}
              style={{ transition: "opacity 200ms ease" }}
              opacity={opacity}
              aria-label={`Bolha ${bubble.localIndex + 1}${bubble.participantName ? `, ${bubble.participantName}` : ""}`}
            >
              {/* Drop shadow */}
              <circle
                cx={bubble.x}
                cy={bubble.y + 1}
                r={radius}
                fill="rgba(0,0,0,0.25)"
              />
              {/* Main circle */}
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={radius}
                fill={bubble.color.fill}
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={strokeWidth}
              />
              {/* Number text */}
              <text
                x={bubble.x}
                y={bubble.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={fontSize}
                fontFamily="Arial, sans-serif"
                fontWeight="600"
                style={{
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                  userSelect: "none",
                }}
              >
                {bubble.localIndex + 1}
              </text>
            </g>
          );
        })}

        {/* Re-draw the hovered bubble on top of everything so it is never hidden */}
        {hovered && (
          <g pointerEvents="none">
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r={radius}
              fill={hovered.color.fill}
              stroke="white"
              strokeWidth={strokeWidth * 1.5}
            />
            <text
              x={hovered.x}
              y={hovered.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={fontSize}
              fontFamily="Arial, sans-serif"
              fontWeight="700"
              style={{ userSelect: "none" }}
            >
              {hovered.localIndex + 1}
            </text>
          </g>
        )}
      </svg>

      {hovered && (
        <HoverTooltip
          store={hoverStore}
          accentColor={hovered.color.stroke}
          title={`Item ${hovered.localIndex + 1}`}
          rows={[
            { label: "Tempo", value: formatTime(hovered.timestamp) },
            {
              label: "Posição",
              value: `${Math.round(hovered.x)}, ${Math.round(hovered.y)}`,
            },
            ...(hovered.participantName
              ? [{ label: "Participante", value: hovered.participantName }]
              : []),
          ]}
        />
      )}

      {/* Legend for multi-session */}
      {isMultiSession && legend.length > 0 && (
        <div
          data-hover-ignore
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 20,
            maxHeight: "40%",
            overflowY: "auto",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: Math.max(9, 11 / zoomScale),
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Participantes
          </span>
          {legend.map((item) => (
            <div
              key={item.sessionId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: item.color.stroke,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "white",
                  fontSize: Math.max(9, 11 / zoomScale),
                  whiteSpace: "nowrap",
                }}
              >
                {item.participantName}{" "}
                <span style={{ color: "rgba(255,255,255,0.5)" }}>
                  ({item.count})
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BubbleCanvas;
