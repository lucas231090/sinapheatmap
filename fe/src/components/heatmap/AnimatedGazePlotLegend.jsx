/* eslint-disable deslop/unused-file */
const AnimatedGazePlotLegend = ({ isMultiSession, legend }) => {
  if (!isMultiSession || legend.length === 0) return null;

  return (
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
  );
};

export default AnimatedGazePlotLegend;
