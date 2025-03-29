import { React, useEffect, useState, useRef, use } from "react";
import { useParams } from "react-router-dom";
import h337 from "@mars3d/heatmap.js";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";

const HeatmapStatic = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { id } = useParams();

  //   Arquivos e Imagem
  const [fileName, setFileName] = useState();
  const [dataFile, setDataFile] = useState();
  const [img, setImg] = useState(null);
  const imgRef = useRef(null);

  //   Canvas e Heatmap
  const [coords, setCoords] = useState([]);
  const [radiusScale, setRadiusScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [done, setDone] = useState(false);
  const canvasRef = useRef(null);
  const heatmapCanvasRef = useRef(null);

  //   Visibilidade do canvas
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [heatmapCanvasVisible, setHeatmapCanvasVisible] = useState(false);

  // Chama fetchData apenas uma vez na montagem do componente
  // 'id' como dependência
  useEffect(() => {
    fetchData();
  }, [id]);

  // Busca os arquivos dos testes uma vez
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/eyetracking/${id}`);
      const data = await res.json();
      console.log("data : ", data);
      setFileName(data.filename);

      if (!data) {
        console.log("Erro: 0 Data");
        return;
      }

      if (data.jsonData.length !== 0) {
        setDataFile(data.jsonData[0]);
      } else if (data.length !== 0) {
        setDataFile(data);
      }

      if (data.mediaPath !== null) {
        const mediaPath = data.mediaPath;
        const imgName = mediaPath.split("/").pop();
        const imageRes = await fetch(
          `${API_BASE_URL}/uploads/media/${imgName}`
        );
        const imageResBlob = await imageRes.blob();
        const imageResUrl = URL.createObjectURL(imageResBlob);
        console.log(imageResUrl);
        setImg(imageResUrl);
      } else {
        console.log("No media file found");
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  function transformToCoordinates(xValues, yValues) {
    // Split the strings into arrays based on the semicolon separator
    const xArray = xValues.split(";").map(Number);
    const yArray = yValues.split(";").map(Number);

    // Ensure both arrays have the same length
    if (xArray.length !== yArray.length) {
      throw new Error("X and Y arrays must have the same length");
    }

    // Map the values into an array of objects with x and y
    return xArray.map((x, index) => ({
      x: x,
      y: yArray[index],
    }));
  }

  useEffect(() => {
    createHeatMap(0.7);
  }, [dataFile]); // 'id' como dependência

  const createHeatMap = (scale) => {
    if (dataFile) {
      // Remove o canvas anterior
      document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());

      // Modifica as coordenadas de forma imutável
      if (dataFile.coordinates === undefined) {
        const coords = transformToCoordinates(dataFile.x, dataFile.y);
        dataFile.coordinates = coords;
      }
      const scaledCoords = dataFile.coordinates.map((coord) => ({
        x: coord.x * scale,
        y: coord.y * scale,
      }));

      const canvasWidth = dataFile["Largura Tela"] * scale * 1.1;
      const canvasHeight = dataFile["Altura Tela"] * scale * 1.1;

      // Atualiza o estado do tamanho do canvas e as coordenadas
      setCanvasSize({ width: canvasWidth, height: canvasHeight });
      setRadiusScale(scale);
      setCoords(scaledCoords);
    }
  };

  // Criação do heatmap quando coords ou canvasSize mudar
  useEffect(() => {
    if (coords.length > 0 && canvasSize.width > 0 && canvasSize.height > 0) {
      const heatmapInstance = h337.create({
        container: document.querySelector(".heatmapContainer"),
        maxOpacity: 1,
        radius: Math.max(10, 50 * radiusScale),
        blur: 0.9,
        backgroundColor: "rgba(255, 255, 255, 0)",
      });

      heatmapInstance.setData({
        data: coords, // Define os dados do heatmap
      });

      setDone(true);
    }
  }, [coords, canvasSize, radiusScale]); // Dependências adequadas

  const downloadHeatMap = () => {
    // A ideia é criar um canvas novo (nao colocando na tela) e baixar como imagem esse novo canvas
    // Pega o canvas do heatmap e cria um novo canvas
    const overlayCanvas = heatmapCanvasRef.current.querySelector("canvas");
    const bubbleCanvas = canvasRef.current;
    const finalCanvas = document.createElement("canvas");
    const finalContext = finalCanvas.getContext("2d");

    // Coloca as dimensoes do heatmap nesse novo canvas
    finalCanvas.width = canvasSize.width;
    finalCanvas.height = canvasSize.height;

    // Coloca a imagem nesse novo canvas
    finalContext.drawImage(
      imgRef.current,
      0,
      0,
      canvasSize.width,
      canvasSize.height
    ); // Using imgRef.current

    // Desenha o heatmap emcima do canvas
    if (!heatmapCanvasVisible) {
      finalContext.drawImage(overlayCanvas, 0, 0);
    }
    // Desenha o canvas com os pontos em cima do heatmap
    if (canvasVisible) {
      finalContext.drawImage(bubbleCanvas, 0, 0);
    }

    // Cria a Imagem do Canvas
    const dataURL = finalCanvas.toDataURL("image/png");

    // Cria um link (nao colocando na tela) e clica nele para baixar o heatmap
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `Heatmap-${fileName}.png`;
    link.click();
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Configurações de alinhamento do texto
    context.textAlign = "center"; // Centraliza o texto horizontalmente
    context.textBaseline = "middle"; // Centraliza o texto verticalmente

    // Função para redesenhar o canvas
    const drawCanvas = (mouseX = null, mouseY = null) => {
      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Array de cores predefinidas (ou você pode gerar dinamicamente)
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

      // Desenhar linhas conectando os pontos
      coords.forEach(({ x, y }, index) => {
        if (index === 0) return; // Não desenha linha para o primeiro ponto

        const prevX = Math.floor(coords[index - 1].x);
        const prevY = Math.floor(coords[index - 1].y);
        const currX = Math.floor(x);
        const currY = Math.floor(y);

        // Define a cor da linha com base no índice
        context.strokeStyle = colors[index % colors.length]; // Cicla pelas cores
        context.lineWidth = 2;

        // Desenha a linha
        context.beginPath();
        context.moveTo(prevX, prevY);
        context.lineTo(currX, currY);
        context.stroke();
      });

      // Desenhar círculos e números em cada ponto
      coords.forEach(({ x, y }, index) => {
        const intX = Math.floor(x);
        const intY = Math.floor(y);

        // Verifica se o mouse está sobre o círculo
        const isHovered =
          mouseX !== null &&
          mouseY !== null &&
          Math.sqrt((mouseX - intX) ** 2 + (mouseY - intY) ** 2) <= 10;

        // Desenha o círculo
        context.beginPath();
        context.arc(intX, intY, isHovered ? 15 : 10, 0, 2 * Math.PI); // Diminui o círculo se estiver hover
        context.fillStyle = isHovered
          ? "rgba(90, 90, 90, 0.25)"
          : "rgba(90, 90, 90,0.75)"; // Transparente se hover
        context.fill();
        context.strokeStyle = "rgba(120,120,120, 0.25)"; // Cor da borda do círculo
        context.stroke();

        // Desenha o número dentro do círculo
        context.fillStyle = "white"; // Cor do texto
        context.fillText(index + 1, intX, intY); // Desenha o índice (baseado em 1)

        // Desenha uma caixa acima do círculo se estiver hover
        if (isHovered) {
          context.fillStyle = "black";
          context.fillRect(intX - 15, intY - 30, 30, 20); // Caixa preta
          context.fillStyle = "white";
          context.fillText(index + 1, intX, intY - 20); // Número dentro da caixa
        }
      });
    };

    // Desenha o canvas inicialmente
    drawCanvas();

    // Evento de mousemove para detectar hover
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Redesenha o canvas com a posição do mouse
      drawCanvas(mouseX, mouseY);
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    // Cleanup do evento
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [coords, canvasSize]);

  useEffect(() => {
    const context = canvasRef.current;
    if (!context) return;
    context.style.visibility = !canvasVisible ? "hidden" : "visible";
    const heatmapCanvas = heatmapCanvasRef.current;
    if (!heatmapCanvas) return;
    heatmapCanvas.style.visibility = heatmapCanvasVisible
      ? "hidden"
      : "visible";
  }, [done, canvasVisible, heatmapCanvasVisible]);

  const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
    return (
      <>
        <div className="flex flex-row justify-between items-center">
          <p className="mb-2 text-3xl text-black">
            <strong>Heatmap :</strong> {fileName || "Nenhum ID fornecido"}
          </p>
          <div className="flex flex-row">
            <button
              className="m-2 bg-indigo-500 hover:bg-indigo-700 text-white p-2 rounded-lg flex items-center gap-2"
              onClick={() => setHeatmapCanvasVisible(!heatmapCanvasVisible)} // Alterna o estado
            >
              {heatmapCanvasVisible ? "Hide Heatmap" : "Show Heatmap"}
            </button>
            <button
              className="m-2 bg-purple-500 hover:bg-purple-700 text-white p-2 rounded-lg flex items-center gap-2"
              onClick={() => setCanvasVisible(!canvasVisible)} // Alterna o estado
            >
              {canvasVisible ? "Hide Bubbles" : "Show Bubbles"}
            </button>
            <button
              className="m-2 bg-blue-500 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center gap-2"
              onClick={() => zoomIn()}
            >
              <ZoomInIcon />
              Zoom In
            </button>
            <button
              className="m-2 bg-green-500 hover:bg-green-700 text-white p-2 rounded-lg flex items-center gap-2"
              onClick={() => zoomOut()}
            >
              <ZoomOutIcon />
              Zoom Out
            </button>
            <button
              className="m-2 bg-yellow-500 hover:bg-yellow-700 text-white p-2 rounded-lg flex items-center gap-2"
              onClick={() => resetTransform()}
            >
              <RefreshIcon />
              Reset
            </button>
            <button
              className="m-2 bg-gray-500 hover:bg-gray-700 text-white p-2 rounded-lg flex items-center gap-2"
              onClick={() => downloadHeatMap()}
            >
              <DownloadIcon />
              Download
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 overflow-x-auto">
      <div className="flex flex-row">
        <div className="bg-white p-4 rounded-lg">
          <TransformWrapper>
            <Controls />
            <TransformComponent>
              {canvasSize.width > 0 && canvasSize.height > 0 && (
                <div>
                  <div
                    className="heatmapContainer"
                    ref={heatmapCanvasRef}
                    style={{
                      width: `${canvasSize.width}px`,
                      height: `${canvasSize.height}px`,
                      position: "relative",
                    }}
                  >
                    {img ? (
                      <img
                        ref={imgRef}
                        src={img}
                        crossOrigin="anonymous"
                        style={{
                          width: `${canvasSize.width}px`,
                          height: `${canvasSize.height}px`,
                          visibility: "visible",
                        }}
                      />
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 2, // Ensure it's above the heatmap canvas
                }}
                width={canvasSize.width}
                height={canvasSize.height}
              ></canvas>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
};

export default HeatmapStatic;
