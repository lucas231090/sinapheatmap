/* eslint-disable deslop/unused-file */
const AnimatedGazePlotFixations = ({
  reversedVisible,
  getFixationRadius,
  latestPerSession,
  fontSize,
}) => {
  return (
    <>
      {reversedVisible.map((fix) => {
        const fullR = getFixationRadius(fix.durationMs);
        const r = fullR * fix.growthFactor;
        const isLatest = latestPerSession.has(fix.globalIndex);

        return (
          <g key={`vfix-${fix.globalIndex}`} opacity={fix.isComplete ? 0.85 : 1}>
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
            <circle cx={fix.x} cy={fix.y + 1.5} r={r} fill="rgba(0,0,0,0.2)" />
            <circle
              cx={fix.x}
              cy={fix.y}
              r={r}
              fill={fix.color.fill}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={1.5}
            />
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
    </>
  );
};

export default AnimatedGazePlotFixations;
