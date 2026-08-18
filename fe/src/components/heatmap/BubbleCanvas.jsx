import { useState, useMemo } from "react";
import { simplifyPath } from "@/utils/heatmapUtils";

const BubbleCanvas = ({
  canvasSize,
  coords,
  coordsBySession,
  transformComponentRef,
  selectedSessionId,
}) => {
  const [hoveredBubble, setHoveredBubble] = useState(null);

  const zoomScale = transformComponentRef?.current?.state?.scale || 1;
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
          });
        });
      });
      return result;
    }
    // Single session — use default red
    const defaultColor = {
      fill: "rgba(255, 0, 0, 0.4)",
      stroke: "#FF6384",
      label: "#FF6384",
    };
    const simplified = simplifyPath(coords || [], 6);
    return simplified.map((coord, index) => ({
      x: coord.x,
      y: coord.y,
      sessionId: "single",
      participantName: "",
      color: defaultColor,
      localIndex: index,
      globalIndex: index,
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

  // Which bubbles to highlight on hover (current + prev + next within same session)
  const highlightedSet = useMemo(() => {
    if (hoveredBubble === null) return null;
    const hovered = bubbles[hoveredBubble];
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
  }, [hoveredBubble, bubbles, sessionGroups]);

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

  const getLineOpacity = (sessionId, fromGlobalIdx, toGlobalIdx) => {
    if (highlightedSet === null) return 0.3;
    if (highlightedSet.has(fromGlobalIdx) && highlightedSet.has(toGlobalIdx)) {
      return 0.9;
    }
    return 0.06;
  };

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          pointerEvents: "all",
          display: "block",
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
                opacity={getLineOpacity(
                  sessionId,
                  prev.globalIndex,
                  bubble.globalIndex,
                )}
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
              onMouseEnter={() => setHoveredBubble(bubble.globalIndex)}
              onMouseLeave={() => setHoveredBubble(null)}
              cursor="pointer"
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
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {bubble.localIndex + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend for multi-session */}
      {isMultiSession && legend.length > 0 && (
        <div
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
