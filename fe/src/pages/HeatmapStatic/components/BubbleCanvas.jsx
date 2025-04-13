import React, { useEffect } from "react";

const BubbleCanvas = ({
  canvasRef,
  canvasSize,
  coords,
  transformComponentRef,
}) => {
  // Efeito para desenhar as bolhas e flechas no canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.textAlign = "center";
    context.textBaseline = "middle";

    // Função para desenhar uma flecha
    const drawArrow = (
      context,
      fromX,
      fromY,
      toX,
      toY,
      bubbleRadius = 10,
      arrowHeadLength = 10
    ) => {
      const angle = Math.atan2(toY - fromY, toX - fromX);

      const adjustedToX = toX - bubbleRadius * Math.cos(angle);
      const adjustedToY = toY - bubbleRadius * Math.sin(angle);

      context.beginPath();
      context.moveTo(fromX, fromY);
      context.lineTo(adjustedToX, adjustedToY);
      context.stroke();

      context.beginPath();
      context.moveTo(adjustedToX, adjustedToY);
      context.lineTo(
        adjustedToX - arrowHeadLength * Math.cos(angle - Math.PI / 6),
        adjustedToY - arrowHeadLength * Math.sin(angle - Math.PI / 6)
      );
      context.lineTo(
        adjustedToX - arrowHeadLength * Math.cos(angle + Math.PI / 6),
        adjustedToY - arrowHeadLength * Math.sin(angle + Math.PI / 6)
      );
      context.lineTo(adjustedToX, adjustedToY);
      context.fillStyle = context.strokeStyle;
      context.fill();
    };

    // Função para desenhar o canvas
    const drawCanvas = (mouseX = null, mouseY = null) => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const colors = [
        "red",
        "blue",
        "orange",
        "purple",
        "cyan",
        "pink",
        "yellow",
        "brown",
        "gray",
        "black",
        "lime",
      ];

      // Desenhar flechas conectando os pontos
      coords.forEach(({ x, y }, index) => {
        if (index === 0) return;

        const prevX = Math.floor(coords[index - 1].x);
        const prevY = Math.floor(coords[index - 1].y);
        const currX = Math.floor(x);
        const currY = Math.floor(y);

        context.strokeStyle = colors[index % colors.length];
        context.lineWidth = 2;

        drawArrow(context, prevX, prevY, currX, currY, 10);
      });

      // Desenhar círculos e números em cada ponto
      coords.forEach(({ x, y }, index) => {
        const intX = Math.floor(x);
        const intY = Math.floor(y);

        const isHovered =
          mouseX !== null &&
          mouseY !== null &&
          Math.sqrt((mouseX - intX) ** 2 + (mouseY - intY) ** 2) <= 10;

        context.beginPath();
        context.arc(intX, intY, isHovered ? 15 : 10, 0, 2 * Math.PI);
        context.fillStyle = isHovered
          ? "rgba(90, 90, 90, 0.25)"
          : "rgba(90, 90, 90,0.75)";
        context.fill();
        context.strokeStyle = "rgba(120,120,120, 0.25)";
        context.stroke();

        context.fillStyle = "white";
        context.fillText(index + 1, intX, intY);

        if (isHovered) {
          context.fillStyle = "black";
          context.fillRect(intX - 15, intY - 30, 30, 20);
          context.fillStyle = "white";
          context.fillText(index + 1, intX, intY - 20);
        }
      });
    };

    drawCanvas();

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const { scale } = transformComponentRef.current.instance.transformState;

      const rawMouseX = event.clientX - rect.left;
      const rawMouseY = event.clientY - rect.top;

      const adjustedMouseX = rawMouseX / scale;
      const adjustedMouseY = rawMouseY / scale;

      drawCanvas(adjustedMouseX, adjustedMouseY);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, [coords, canvasSize, transformComponentRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 2,
      }}
      width={canvasSize.width}
      height={canvasSize.height}
    />
  );
};

export default BubbleCanvas;
