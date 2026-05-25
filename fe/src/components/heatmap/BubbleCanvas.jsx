import { useEffect } from "react";

const BubbleCanvas = ({
  canvasRef,
  canvasSize,
  coords,
  transformComponentRef,
}) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || coords.length === 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    coords.forEach((coord, index) => {
      // Scale based on zoom
      const zoomScale = transformComponentRef?.current?.state?.scale || 1;
      const baseRadius = 15;
      const radius = Math.max(8, baseRadius / Math.sqrt(zoomScale));

      context.beginPath();
      context.arc(coord.x, coord.y, radius, 0, 2 * Math.PI);
      context.fillStyle = "rgba(255, 0, 0, 0.4)";
      context.fill();

      context.lineWidth = Math.max(1, 2 / zoomScale);
      context.strokeStyle = "rgba(255, 255, 255, 0.8)";
      context.stroke();

      context.font = `${Math.max(10, 14 / zoomScale)}px Arial`;
      context.fillStyle = "white";
      context.textAlign = "center";
      context.textBaseline = "middle";

      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 4;
      context.fillText(index + 1, coord.x, coord.y);

      context.shadowBlur = 0;
    });
  }, [coords, canvasSize, transformComponentRef?.current?.state?.scale, canvasRef, transformComponentRef]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      style={{
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        pointerEvents: "none",
      }}
    />
  );
};

export default BubbleCanvas;
