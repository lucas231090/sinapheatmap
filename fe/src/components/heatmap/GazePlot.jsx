import { useState, useMemo } from "react";
import { computeFixations } from "@/utils/heatmapUtils";

const GazePlotLegend = ({ isMultiSession, legend, zoomScale }) => {
  if (!isMultiSession || legend.length === 0) return null;
  return (
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
        Fixações
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
              ({item.count} fix.)
            </span>
          </span>
        </div>
      ))}
    </div>
  );
};

const GazePlotSaccades = ({
  sessionFixationGroups,
  arrowSize,
  getFixationRadius,
  lineWidth,
  getLineOpacity,
}) => {
  return (
    <>
      <defs>
        {Object.entries(sessionFixationGroups).map(
          ([sessionId, fixes]) =>
            fixes.length > 0 && (
              <marker
                key={`arrow-${sessionId}`}
                id={`arrowhead-${sessionId}`}
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
                  opacity={0.7}
                />
              </marker>
            ),
        )}
      </defs>

      {Object.entries(sessionFixationGroups).map(([sessionId, sessionFixes]) =>
        sessionFixes.slice(1).map((fix, i) => {
          const prev = sessionFixes[i];
          const r = getFixationRadius(fix.durationMs);
          const dx = fix.x - prev.x;
          const dy = fix.y - prev.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 1) return null;

          const prevR = getFixationRadius(prev.durationMs);
          const ux = dx / dist;
          const uy = dy / dist;
          const x1 = prev.x + ux * prevR;
          const y1 = prev.y + uy * prevR;
          const x2 = fix.x - ux * r;
          const y2 = fix.y - uy * r;

          return (
            <line
              key={`sacline-${sessionId}-${fix.globalIndex}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={fix.color.stroke}
              strokeWidth={lineWidth}
              opacity={getLineOpacity(prev.globalIndex, fix.globalIndex)}
              markerEnd={`url(#arrowhead-${sessionId})`}
              style={{ transition: "opacity 200ms ease" }}
            />
          );
        }),
      )}
    </>
  );
};

const GazePlotFixations = ({
  reversedFixations,
  getFixationRadius,
  getFixationOpacity,
  setHoveredFixation,
  hoveredFixation,
  strokeWidth,
  fontSize,
  zoomScale,
}) => {
  return (
    <>
      {reversedFixations.map((fix) => {
        const r = getFixationRadius(fix.durationMs);
        const opacity = getFixationOpacity(fix.globalIndex);

        return (
          <g
            key={`fix-${fix.globalIndex}`}
            style={{ transition: "opacity 200ms ease" }}
            opacity={opacity}
            onMouseEnter={() => setHoveredFixation(fix.globalIndex)}
            onMouseLeave={() => setHoveredFixation(null)}
            cursor="pointer"
          >
            <circle
              cx={fix.x}
              cy={fix.y}
              r={r + 3}
              fill="none"
              stroke={fix.color.stroke}
              strokeWidth={1}
              opacity={0.3}
            />
            <circle cx={fix.x} cy={fix.y + 1.5} r={r} fill="rgba(0,0,0,0.2)" />
            <circle
              cx={fix.x}
              cy={fix.y}
              r={r}
              fill={fix.color.fill}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={strokeWidth}
            />
            <text
              x={fix.x}
              y={fix.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={Math.min(fontSize, r * 1.2)}
              fontFamily="Arial, sans-serif"
              fontWeight="700"
              style={{
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {fix.pointCount}
            </text>

            {hoveredFixation === fix.globalIndex && (
              <g>
                <rect
                  x={fix.x + r + 5}
                  y={fix.y - 14}
                  width={Math.max(60, `${fix.durationMs}ms`.length * 8 + 16)}
                  height={22}
                  rx={6}
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                />
                <text
                  x={fix.x + r + 5 + 8}
                  y={fix.y - 3}
                  fill="white"
                  fontSize={Math.max(9, 11 / zoomScale)}
                  fontFamily="monospace"
                  style={{ pointerEvents: "none" }}
                >
                  {fix.durationMs}ms
                </text>
              </g>
            )}
          </g>
        );
      })}
    </>
  );
};



const GazePlot = ({
  canvasSize,
  coords,
  coordsBySession,
  transformComponentRef,
  selectedSessionId,
  mediaUrl,
  imgRef,
}) => {
  const [hoveredFixation, setHoveredFixation] = useState(null);

  const zoomScale = transformComponentRef?.current?.state?.scale || 1;
  const fontSize = Math.max(10, 14 / zoomScale);
  const strokeWidth = Math.max(1, 2 / zoomScale);
  const lineWidth = Math.max(0.8, 1.5 / zoomScale);
  const arrowSize = Math.max(4, 6 / zoomScale);

  const isMultiSession =
    selectedSessionId === "all" && coordsBySession && coordsBySession.length > 1;

  // Compute fixations per session (or single)
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

  // Build flat list with global IDs for hover logic
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

  // Group by session for saccade lines
  const sessionFixationGroups = useMemo(() => {
    const groups = {};
    allFixations.forEach((fix) => {
      if (!groups[fix.sessionId]) {
        groups[fix.sessionId] = [];
      }
      groups[fix.sessionId].push(fix);
    });
    return groups;
  }, [allFixations]);

  // Reversed for rendering: first fixations appear on top
  const reversedFixations = useMemo(
    () => [...allFixations].reverse(),
    [allFixations],
  );

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
    const minRadius = Math.max(10, 18 / Math.sqrt(zoomScale));
    const maxRadius = Math.max(25, 45 / Math.sqrt(zoomScale));
    if (maxDuration <= minDuration) return (minRadius + maxRadius) / 2;
    const t = (durationMs - minDuration) / (maxDuration - minDuration);
    return minRadius + t * (maxRadius - minRadius);
  };

  // Hover highlight logic (same as BubbleCanvas)
  const highlightedSet = useMemo(() => {
    if (hoveredFixation === null) return null;
    const hovered = allFixations[hoveredFixation];
    if (!hovered) return null;

    const sessionFixes = sessionFixationGroups[hovered.sessionId] || [];
    const posInSession = sessionFixes.findIndex(
      (f) => f.globalIndex === hovered.globalIndex,
    );

    const highlighted = new Set();
    highlighted.add(hovered.globalIndex);
    if (posInSession > 0) {
      highlighted.add(sessionFixes[posInSession - 1].globalIndex);
    }
    if (posInSession < sessionFixes.length - 1) {
      highlighted.add(sessionFixes[posInSession + 1].globalIndex);
    }
    return highlighted;
  }, [hoveredFixation, allFixations, sessionFixationGroups]);

  const getFixationOpacity = (globalIndex) => {
    if (highlightedSet === null) return 1;
    return highlightedSet.has(globalIndex) ? 1 : 0.12;
  };

  const getLineOpacity = (fromGlobalIdx, toGlobalIdx) => {
    if (highlightedSet === null) return 0.4;
    if (highlightedSet.has(fromGlobalIdx) && highlightedSet.has(toGlobalIdx)) {
      return 0.9;
    }
    return 0.06;
  };

  // Legend
  const legend = useMemo(() => {
    if (!isMultiSession) return [];
    return fixationGroups.map((group) => ({
      sessionId: group.sessionId,
      participantName: group.participantName,
      color: group.color,
      count: group.fixations.length,
    }));
  }, [isMultiSession, fixationGroups]);

  return (
    <div style={{ position: "relative" }}>
      {/* Background image */}
      {mediaUrl && (
        <img
          ref={imgRef}
          src={mediaUrl}
          crossOrigin="anonymous"
          alt="Gaze plot background"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            objectFit: "contain",
            objectPosition: "center",
            backgroundColor: "#020617",
          }}
        />
      )}

      <svg
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          pointerEvents: "all",
          display: "block",
          position: "relative",
          zIndex: 2,
          opacity: 0.75,
        }}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
      >
        <GazePlotSaccades
          sessionFixationGroups={sessionFixationGroups}
          arrowSize={arrowSize}
          getFixationRadius={getFixationRadius}
          lineWidth={lineWidth}
          getLineOpacity={getLineOpacity}
        />
        <GazePlotFixations
          reversedFixations={reversedFixations}
          getFixationRadius={getFixationRadius}
          getFixationOpacity={getFixationOpacity}
          setHoveredFixation={setHoveredFixation}
          hoveredFixation={hoveredFixation}
          strokeWidth={strokeWidth}
          fontSize={fontSize}
          zoomScale={zoomScale}
        />
      </svg>

      <GazePlotLegend
        isMultiSession={isMultiSession}
        legend={legend}
        zoomScale={zoomScale}
      />
    </div>
  );
};

export default GazePlot;
