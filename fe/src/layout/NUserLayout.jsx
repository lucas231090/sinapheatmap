import { Outlet } from "react-router-dom";

const bubbleColors = ["#42C9E4", "#87D4F3", "#B8EDF3"];

const bubbleGroups = [
  { size: 72, duration: 12, opacity: 0.42, scale: 1, blur: 0 },
  { size: 48, duration: 18, opacity: 0.34, scale: 1, blur: 0 },
  { size: 28, duration: 26, opacity: 0.24, scale: 1, blur: 0 },
];

const bubbles = Array.from({ length: 24 }, (_, index) => {
  const group = bubbleGroups[index % bubbleGroups.length];
  const column = index % 8;
  const row = Math.floor(index / 8);
  const left = 8 + column * 11 + (row % 2 === 0 ? 0 : 3);

  return {
    id: index,
    left,
    startOffset: 10 + ((index * 7) % 24),
    color: bubbleColors[index % bubbleColors.length],
    size: group.size,
    duration: group.duration,
    opacity: group.opacity,
    scale: group.scale,
    blur: group.blur,
    delay: -(index * 1.8),
  };
});

export default function NUserLayout() {
  return (
    <div className="relative isolate flex min-h-screen w-screen flex-col overflow-hidden bg-sinapgreen-500 text-white dark:bg-gray-900">
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            className="nlayout-bubble absolute rounded-full"
            style={{
              left: `${bubble.left}%`,
              top: `calc(100% + ${bubble.startOffset}px)`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              backgroundColor: bubble.color,
              opacity: bubble.opacity,
              animationDuration: `${bubble.duration}s`,
              animationDelay: `${bubble.delay}s`,
              transform: "translate3d(0, 0, 0) scale(var(--bubble-scale))",
              "--bubble-scale": bubble.scale,
              "--bubble-opacity": bubble.opacity,
              boxShadow: "0 0 20px rgba(255, 255, 255, 0.08)",
              filter: bubble.blur ? `blur(${bubble.blur}px)` : "none",
              transformOrigin: "center",
            }}
          />
        ))}
      </div>
      <main className="relative z-10 flex flex-1 overflow-hidden ">
        <Outlet />
      </main>
    </div>
  );
}
