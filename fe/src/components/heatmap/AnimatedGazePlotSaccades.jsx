/* eslint-disable deslop/unused-file */
const AnimatedGazePlotSaccades = ({ sessionGroups, arrowSize, getFixationRadius, lineWidth }) => {
  return (
    <>
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

      {Object.entries(sessionGroups).map(([sessionId, sessionFixes]) =>
        sessionFixes.slice(1).map((fix, i) => {
          const prev = sessionFixes[i];
          const r = getFixationRadius(fix.durationMs) * fix.growthFactor;
          const prevR = getFixationRadius(prev.durationMs) * prev.growthFactor;

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
              key={`vsacline-${sessionId}-${fix.globalIndex}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={fix.color.stroke}
              strokeWidth={lineWidth}
              opacity={0.45 * (fix.opacityFactor ?? 1)}
              markerEnd={`url(#varrowhead-${sessionId})`}
            />
          );
        }),
      )}
    </>
  );
};
export default AnimatedGazePlotSaccades;
