import { useState, useMemo, useCallback } from "react";
import { computeFixations } from "@/utils/heatmapUtils";
import {
  createHoverStore,
  getSurfaceHandlers,
  hitTestCircles,
  useHoverLayer,
} from "./hover/hoverStore";
import HoverTooltip from "./hover/HoverTooltip";

const formatTime = (milliseconds) => {
  const value = Math.max(0, Math.round(Number(milliseconds) || 0));
  const minutes = Math.floor(value / 60000);
  const seconds = Math.floor((value % 60000) / 1000);
  const remainder = value % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(remainder).padStart(3, "0")}`;
};

const LAYER_ID = "gazeplot";
const MAX_TOOLTIP_INTERVALS = 6;

const GazePlotLegend = ({ isMultiSession, legend, zoomScale }) => {
  if (!isMultiSession || legend.length === 0) return null;
  return (
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

const FixationCircle = ({ fix, r, strokeWidth, fontSize, highlighted }) => (
  <>
    <circle
      cx={fix.x}
      cy={fix.y}
      r={r + 3}
      fill="none"
      stroke={highlighted ? "white" : fix.color.stroke}
      strokeWidth={highlighted ? strokeWidth * 1.5 : 1}
      opacity={highlighted ? 0.9 : 0.3}
    />
    <circle cx={fix.x} cy={fix.y + 1.5} r={r} fill="rgba(0,0,0,0.2)" />
    <circle
      cx={fix.x}
      cy={fix.y}
      r={r}
      fill={fix.color.fill}
      stroke={highlighted ? "white" : "rgba(255,255,255,0.9)"}
      strokeWidth={highlighted ? strokeWidth * 1.5 : strokeWidth}
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
        userSelect: "none",
      }}
    >
      {(fix.localIndex ?? fix.globalIndex ?? 0) + 1}
    </text>
  </>
);

const GazePlotFixations = ({
  reversedFixations,
  getFixationRadius,
  getFixationOpacity,
  strokeWidth,
  fontSize,
}) => {
  return (
    <>
      {reversedFixations.map((fix) => (
        <g
          key={`fix-${fix.globalIndex}`}
          style={{ transition: "opacity 200ms ease" }}
          opacity={getFixationOpacity(fix.globalIndex)}
          aria-label={`Fixação ${fix.localIndex + 1}${fix.participantName ? `, ${fix.participantName}` : ""}`}
        >
          <FixationCircle
            fix={fix}
            r={getFixationRadius(fix.durationMs)}
            strokeWidth={strokeWidth}
            fontSize={fontSize}
          />
        </g>
      ))}
    </>
  );
};

const GazePlot = ({
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

    const singleSessionGroup = coordsBySession?.[0];
    const defaultColor = singleSessionGroup?.color || {
      fill: "rgba(255, 0, 0, 0.4)",
      stroke: "#FF6384",
      label: "#FF6384",
    };
    const fixations = computeFixations(coords || []);
    return [
      {
        sessionId: singleSessionGroup?.sessionId || "single",
        participantName: singleSessionGroup?.participantName || "",
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

  const regionInfoByGlobalIndex = useMemo(() => {
    const regions = {};
    allFixations.forEach((fix) => {
      const relatedFixations = allFixations.filter(
        (candidate) =>
          candidate.sessionId === fix.sessionId &&
          Math.hypot(candidate.x - fix.x, candidate.y - fix.y) <= 50,
      );
      regions[fix.globalIndex] = {
        totalDurationMs: relatedFixations.reduce(
          (total, candidate) => total + candidate.durationMs,
          0,
        ),
        visitCount: relatedFixations.length,
        intervals: relatedFixations.map(
          (candidate) =>
            `${formatTime(candidate.startTime)}-${formatTime(candidate.endTime)}`,
        ),
      };
    });
    return regions;
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

  const getFixationRadius = useCallback(
    (durationMs) => {
      const minRadius = Math.max(10, 18 / Math.sqrt(zoomScale));
      const maxRadius = Math.max(25, 45 / Math.sqrt(zoomScale));
      if (maxDuration <= minDuration) return (minRadius + maxRadius) / 2;
      const t = (durationMs - minDuration) / (maxDuration - minDuration);
      return minRadius + t * (maxRadius - minRadius);
    },
    [zoomScale, minDuration, maxDuration],
  );

  // Hit-test with the exact rendering geometry. `allFixations` is already in
  // top-to-bottom visual order (index 0 is drawn last / on top).
  const hitTest = useCallback(
    (x, y, unitsPerPixel) =>
      hitTestCircles(
        allFixations,
        (fix) => getFixationRadius(fix.durationMs),
        x,
        y,
        unitsPerPixel,
      ),
    [allFixations, getFixationRadius],
  );

  const hoveredFixation = useHoverLayer(hoverStore, LAYER_ID, {
    priority: 2,
    hitTest,
    enabled: interactive && allFixations.length > 0,
  });
  const hovered =
    hoveredFixation !== null ? allFixations[hoveredFixation] : null;

  // Hover highlight logic (same as BubbleCanvas)
  const highlightedSet = useMemo(() => {
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
  }, [hovered, sessionFixationGroups]);

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
    isStandalone && interactive ? { ref: surfaceRef, ...surfaceHandlers } : {};

  const tooltip = useMemo(() => {
    if (!hovered) return null;
    const region = regionInfoByGlobalIndex[hovered.globalIndex];
    const visibleIntervals = region.intervals.slice(0, MAX_TOOLTIP_INTERVALS);
    const hiddenCount = region.intervals.length - visibleIntervals.length;
    return {
      title: `Fixação ${hovered.localIndex + 1}`,
      rows: [
        { label: "Duração", value: `${Math.round(hovered.durationMs)} ms` },
        {
          label: "Intervalo",
          value: `${formatTime(hovered.startTime)}-${formatTime(hovered.endTime)}`,
        },
        { label: "Pontos", value: String(hovered.pointCount) },
        {
          label: "Região",
          value: `Total: ${Math.round(region.totalDurationMs)} ms (${region.visitCount} passage${region.visitCount === 1 ? "m" : "ns"})`,
        },
        {
          label: "Participante",
          value: hovered.participantName || "Participante atual",
        },
      ],
      footer:
        region.visitCount > 1 ? (
          <>
            <span className="mb-1 block font-semibold text-white/80">
              Intervalos na região
            </span>
            <ul className="space-y-0.5 font-mono">
              {visibleIntervals.map((interval, index) => (
                <li key={`${interval}-${index}`}>{interval}</li>
              ))}
              {hiddenCount > 0 && (
                <li className="text-white/50">+{hiddenCount} intervalo(s)</li>
              )}
            </ul>
          </>
        ) : null,
    };
  }, [hovered, regionInfoByGlobalIndex]);

  return (
    <div style={{ position: "relative" }}>
      <svg
        {...standaloneSurfaceProps}
        data-testid="gazeplot-svg"
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          pointerEvents: isStandalone && interactive ? "all" : "none",
          cursor: hovered ? "pointer" : undefined,
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
          strokeWidth={strokeWidth}
          fontSize={fontSize}
        />

        {/* Re-draw the hovered fixation on top so it is never hidden */}
        {hovered && (
          <g pointerEvents="none">
            <FixationCircle
              fix={hovered}
              r={getFixationRadius(hovered.durationMs)}
              strokeWidth={strokeWidth}
              fontSize={fontSize}
              highlighted
            />
          </g>
        )}
      </svg>

      {hovered && tooltip && (
        <HoverTooltip
          store={hoverStore}
          accentColor={hovered.color.stroke}
          title={tooltip.title}
          rows={tooltip.rows}
          footer={tooltip.footer}
        />
      )}

      <GazePlotLegend
        isMultiSession={isMultiSession}
        legend={legend}
        zoomScale={zoomScale}
      />
    </div>
  );
};

export default GazePlot;
