import { useMemo } from "react";
import { computeFixations } from "@/utils/heatmapUtils";

/**
 * Animated Gaze Plot overlay for Remotion video context.
 * Shows fixation circles growing progressively as time advances.
 * Circle size is proportional to fixation duration.
 */
const AnimatedGazePlotOverlay = ({
  canvasSize,
  coords,
  coordsBySession,
  selectedSessionId,
  currentTimeMs,
}) => {
  const isMultiSession =
    selectedSessionId === "all" && coordsBySession && coordsBySession.length > 1;

  // Compute fixations per session
  const fixationGroups = useMemo(() => {
    if (isMultiSession && coordsBySession) {
      return coordsBySession.map((sessionGroup) => {
        const fixations = computeFixations(sessionGroup.coords);
        return {
          sessionId: sessionGroup.sessionId,
          participantName: sessionGroup.participantName,
          color: sessionGroup.color,
          fixations,
        };
      });
    }

    const defaultColor = {
      fill: "rgba(255, 0, 0, 0.4)",
      stroke: "#FF6384",
      label: "#FF6384",
    };
    const fixations = computeFixations(coords || []);
    return [
      {
        sessionId: "single",
        participantName: "",
        color: defaultColor,
        fixations,
      },
    ];
  }, [coords, coordsBySession, isMultiSession]);

  // Build flat list with visibility and growth info
  const allFixations = useMemo(() => {
    const result = [];
    fixationGroups.forEach((group) => {
      group.fixations.forEach((fix, localIndex) => {
        result.push({
          ...fix,
          sessionId: group.sessionId,
          participantName: group.participantName,
          color: group.color,
          localIndex,
          globalIndex: result.length,
        });
      });
    });
    return result;
  }, [fixationGroups]);

  // Compute radius range for proportional sizing
  const { minDuration, maxDuration } = useMemo(() => {
    if (allFixations.length === 0) return { minDuration: 0, maxDuration: 1000 };
    const durations = allFixations.map((f) => f.durationMs);
    return {
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  }, [allFixations]);

  const getFixationRadius = (durationMs) => {
    const minRadius = 14;
    const maxRadius = 38;
    if (maxDuration <= minDuration) return (minRadius + maxRadius) / 2;
    const t = (durationMs - minDuration) / (maxDuration - minDuration);
    return minRadius + t * (maxRadius - minRadius);
  };

  // Visible fixations: completed (endTime <= currentTimeMs) or in-progress
  const visibleFixations = useMemo(() => {
    return allFixations
      .filter((fix) => fix.startTime <= currentTimeMs)
      .map((fix) => {
        const isComplete = fix.endTime <= currentTimeMs;
        // For in-progress fixations, compute partial growth
        let growthFactor = 1;
        if (!isComplete) {
          const elapsed = currentTimeMs - fix.startTime;
          growthFactor = Math.min(1, elapsed / fix.durationMs);
        }
        return { ...fix, isComplete, growthFactor };
      });
  }, [allFixations, currentTimeMs]);

  // Group visible by session for saccade lines
  const sessionGroups = useMemo(() => {
    const groups = {};
    visibleFixations.forEach((fix) => {
      if (!groups[fix.sessionId]) {
        groups[fix.sessionId] = [];
      }
      groups[fix.sessionId].push(fix);
    });
    return groups;
  }, [visibleFixations]);

  // Reversed for rendering: first fixations on top
  const reversedVisible = useMemo(
    () => [...visibleFixations].reverse(),
    [visibleFixations],
  );

  // Latest per session for pulse
  const latestPerSession = useMemo(() => {
    const latest = new Set();
    Object.values(sessionGroups).forEach((group) => {
      if (group.length > 0) {
        latest.add(group[group.length - 1].globalIndex);
      }
    });
    return latest;
  }, [sessionGroups]);

  const lineWidth = 1.2;
  const arrowSize = 5;
  const fontSize = 12;

  // Legend
  const legend = useMemo(() => {
    if (!isMultiSession) return [];
    return fixationGroups.map((group) => ({
      sessionId: group.sessionId,
      participantName: group.participantName,
      color: group.color,
      count: group.fixations.filter((f) => f.startTime <= currentTimeMs).length,
    }));
  }, [isMultiSession, fixationGroups, currentTimeMs]);

  if (visibleFixations.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        pointerEvents: "none",
        zIndex: 13,
      }}
    >
      <svg
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        style={{ display: "block", opacity: 0.75 }}
      >
        {/* Arrow markers */}
        <defs>
          {Object.entries(sessionGroups).map(
            ([sessionId, fixes]) =>
              fixes.length > 0 && (
                <marker
                  key={`varrow-${sessionId}`}
                  id={`varrowhead-${sessionId}`}
                  markerWidth={arrowSize}
                  markerHeight={arrowSize}
                  refX={arrowSize}
                  refY={arrowSize / 2}
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <polygon
                    points={`0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}`}
                    fill={fixes[0].color.stroke}
                    opacity={0.6}
                  />
                </marker>
              ),
          )}
        </defs>

        {/* Saccade lines with arrows */}
        {Object.entries(sessionGroups).map(([sessionId, sessionFixes]) =>
          sessionFixes.slice(1).map((fix, i) => {
            const prev = sessionFixes[i];
            const r = getFixationRadius(fix.durationMs) * fix.growthFactor;
            const prevR =
              getFixationRadius(prev.durationMs) * prev.growthFactor;

            const dx = fix.x - prev.x;
            const dy = fix.y - prev.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 1) return null;

            const ux = dx / dist;
            const uy = dy / dist;
            const x1 = prev.x + ux * prevR;
            const y1 = prev.y + uy * prevR;
            const x2 = fix.x - ux * r;
            const y2 = fix.y - uy * r;

            return (
              <line
                key={`vsacline-${sessionId}-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={fix.color.stroke}
                strokeWidth={lineWidth}
                opacity={0.45}
                markerEnd={`url(#varrowhead-${sessionId})`}
              />
            );
          }),
        )}

        {/* Fixation circles */}
        {reversedVisible.map((fix) => {
          const fullR = getFixationRadius(fix.durationMs);
          const r = fullR * fix.growthFactor;
          const isLatest = latestPerSession.has(fix.globalIndex);

          return (
            <g
              key={`vfix-${fix.globalIndex}`}
              opacity={fix.isComplete ? 0.85 : 1}
            >
              {/* Pulse ring on in-progress or latest */}
              {(isLatest || !fix.isComplete) && (
                <circle
                  cx={fix.x}
                  cy={fix.y}
                  r={r + 4}
                  fill="none"
                  stroke={fix.color.stroke}
                  strokeWidth={1.5}
                  opacity={fix.isComplete ? 0.4 : 0.6}
                />
              )}
              {/* Shadow */}
              <circle
                cx={fix.x}
                cy={fix.y + 1.5}
                r={r}
                fill="rgba(0,0,0,0.2)"
              />
              {/* Main circle */}
              <circle
                cx={fix.x}
                cy={fix.y}
                r={r}
                fill={fix.color.fill}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={1.5}
              />
              {/* Fixation number */}
              {r > 6 && (
                <text
                  x={fix.x}
                  y={fix.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={Math.min(fontSize, r * 1.1)}
                  fontFamily="Arial, sans-serif"
                  fontWeight="700"
                  style={{ pointerEvents: "none" }}
                >
                  {fix.pointCount}
                </text>
              )}
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
            Fixações
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
                  ({item.count} fix.)
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimatedGazePlotOverlay;
