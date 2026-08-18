import { useMemo } from "react";
import { simplifyPath } from "@/utils/heatmapUtils";

/**
 * Animated Bubble overlay for Remotion video context.
 * Shows bubbles appearing progressively as time advances.
 * No hover interaction (it's a video).
 */
const AnimatedBubbleOverlay = ({
  canvasSize,
  coords,
  coordsBySession,
  selectedSessionId,
  currentTimeMs,
}) => {
  const isMultiSession =
    selectedSessionId === "all" && coordsBySession && coordsBySession.length > 1;

  // Build flat list of bubbles with session color info and timestamps
  const allBubbles = useMemo(() => {
    if (isMultiSession && coordsBySession) {
      const result = [];
      coordsBySession.forEach((sessionGroup) => {
        const simplified = simplifyPath(sessionGroup.coords, 6);
        simplified.forEach((coord, localIndex) => {
          result.push({
            x: coord.x,
            y: coord.y,
            timestamp: coord.timestamp ?? localIndex * (1000 / 60),
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

    const defaultColor = {
      fill: "rgba(255, 0, 0, 0.4)",
      stroke: "#FF6384",
      label: "#FF6384",
    };
    const simplified = simplifyPath(coords || [], 6);
    return simplified.map((coord, index) => ({
      x: coord.x,
      y: coord.y,
      timestamp: coord.timestamp ?? index * (1000 / 60),
      sessionId: "single",
      participantName: "",
      color: defaultColor,
      localIndex: index,
      globalIndex: index,
    }));
  }, [coords, coordsBySession, isMultiSession]);

  // Only show bubbles whose timestamp <= currentTimeMs
  const visibleBubbles = useMemo(() => {
    return allBubbles.filter((b) => b.timestamp <= currentTimeMs);
  }, [allBubbles, currentTimeMs]);

  // Group visible bubbles by session for saccade lines
  const sessionGroups = useMemo(() => {
    const groups = {};
    visibleBubbles.forEach((bubble) => {
      if (!groups[bubble.sessionId]) {
        groups[bubble.sessionId] = [];
      }
      groups[bubble.sessionId].push(bubble);
    });
    return groups;
  }, [visibleBubbles]);

  // Reversed for rendering: first bubbles on top
  const reversedVisible = useMemo(
    () => [...visibleBubbles].reverse(),
    [visibleBubbles],
  );

  // The latest bubble per session for pulse effect
  const latestPerSession = useMemo(() => {
    const latest = new Set();
    Object.values(sessionGroups).forEach((group) => {
      if (group.length > 0) {
        latest.add(group[group.length - 1].globalIndex);
      }
    });
    return latest;
  }, [sessionGroups]);

  const radius = 12;
  const lineWidth = 1.5;
  const fontSize = 11;

  // Legend for multi-session
  const legend = useMemo(() => {
    if (!isMultiSession || !coordsBySession) return [];
    return coordsBySession.map((group) => ({
      sessionId: group.sessionId,
      participantName: group.participantName,
      color: group.color,
      count: group.coords.filter((c) => (c.timestamp ?? 0) <= currentTimeMs)
        .length,
    }));
  }, [isMultiSession, coordsBySession, currentTimeMs]);

  if (visibleBubbles.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        pointerEvents: "none",
        zIndex: 12,
      }}
    >
      <svg
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        style={{ display: "block", opacity: 0.75 }}
      >
        {/* Saccade lines per session */}
        {Object.entries(sessionGroups).map(([sessionId, sessionBubbles]) =>
          sessionBubbles.slice(1).map((bubble, i) => {
            const prev = sessionBubbles[i];
            return (
              <line
                key={`vline-${sessionId}-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={bubble.x}
                y2={bubble.y}
                stroke={bubble.color.stroke}
                strokeWidth={lineWidth}
                opacity={0.35}
              />
            );
          }),
        )}

        {/* Bubbles in reverse order */}
        {reversedVisible.map((bubble) => {
          const isLatest = latestPerSession.has(bubble.globalIndex);
          const r = isLatest ? radius * 1.3 : radius;

          return (
            <g key={`vbub-${bubble.globalIndex}`} opacity={isLatest ? 1 : 0.85}>
              {/* Pulse ring on latest */}
              {isLatest && (
                <circle
                  cx={bubble.x}
                  cy={bubble.y}
                  r={r + 5}
                  fill="none"
                  stroke={bubble.color.stroke}
                  strokeWidth={1.5}
                  opacity={0.5}
                />
              )}
              {/* Shadow */}
              <circle
                cx={bubble.x}
                cy={bubble.y + 1}
                r={r}
                fill="rgba(0,0,0,0.25)"
              />
              {/* Main circle */}
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={r}
                fill={bubble.color.fill}
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={1.5}
              />
              {/* Number */}
              <text
                x={bubble.x}
                y={bubble.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={fontSize}
                fontFamily="Arial, sans-serif"
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {bubble.localIndex + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {isMultiSession && legend.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "rgba(15, 23, 42, 0.8)",
            borderRadius: 8,
            padding: "6px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            zIndex: 20,
            maxHeight: "35%",
            overflowY: "auto",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 9,
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
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: item.color.stroke,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "white", fontSize: 9, whiteSpace: "nowrap" }}>
                {item.participantName}{" "}
                <span style={{ color: "rgba(255,255,255,0.4)" }}>
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

export default AnimatedBubbleOverlay;
