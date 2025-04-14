import { useState, useEffect } from "react";
import { getFileById, getFileMedia } from "../../../services/fileService";

const useHeatmapData = (id, selectedTestIndex, canvasRef, heatmapCanvasRef, imgRef, heatmapVisible, canvasVisible) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Estados
    const [fileName, setFileName] = useState();
    const [dataFile, setDataFile] = useState();
    const [jsonFile, setJsonFile] = useState();
    const [img, setImg] = useState(null);
    const [coords, setCoords] = useState([]);
    const [radiusScale, setRadiusScale] = useState(1);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [done, setDone] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    // Fetch data when ID changes
    useEffect(() => {
        fetchData();
    }, [id]);

    // Listen for window resize
    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch data from API
    const fetchData = async () => {
        try {
            const data = await getFileById(id);
            console.log("data : ", data);
            setFileName(data.filename);

            if (!data) {
                console.log("Erro: 0 Data");
                return;
            }
            setDataFile(data);

            if (data.jsonData.length !== 0) {
                setJsonFile(data.jsonData[0]);
            } else if (data.length !== 0) {
                setJsonFile(data);
            }

            if (data.mediaPath !== null) {
                const mediaPath = data.mediaPath;
                const imgName = mediaPath.split("/").pop();
                try {
                    const imageUrl = await getFileMedia(imgName);
                    console.log(imageUrl);
                    setImg(imageUrl);
                } catch (mediaError) {
                    console.log("Error loading media:", mediaError);
                }
            } else {
                console.log("No media file found");
            }
        } catch (err) {
            console.log(err.message);
        }
    };

    // Transform string coordinates to objects
    function transformToCoordinates(xValues, yValues) {
        const xArray = xValues.split(";").map(Number);
        const yArray = yValues.split(";").map(Number);

        if (xArray.length !== yArray.length) {
            throw new Error("X and Y arrays must have the same length");
        }

        return xArray.map((x, index) => ({
            x: x,
            y: yArray[index],
        }));
    }

    // Process data and create heatmap when data changes
    useEffect(() => {
        const combineCoordinates = (dataFiles, selectedIndex) => {
            let combinedCoords = [];

            if (!dataFiles?.jsonData) return [];

            if (selectedIndex === "all") {
                dataFiles.jsonData.forEach((dataFile) => {
                    if (dataFile.coordinates) {
                        combinedCoords = combinedCoords.concat(dataFile.coordinates);
                    } else if (dataFile.x && dataFile.y) {
                        const coords = transformToCoordinates(dataFile.x, dataFile.y);
                        combinedCoords = combinedCoords.concat(coords);
                    }
                });
            } else {
                const dataFile = dataFiles.jsonData[selectedIndex];
                if (dataFile.coordinates) {
                    combinedCoords = dataFile.coordinates;
                } else if (dataFile.x && dataFile.y) {
                    combinedCoords = transformToCoordinates(dataFile.x, dataFile.y);
                }
            }

            return combinedCoords;
        };

        const calculateResponsiveScale = () => {
            if (!jsonFile) return 1;

            const availableWidth = windowSize.width * 0.85;
            const availableHeight = windowSize.height * 0.7;

            const originalWidth = jsonFile["Largura Tela"];
            const originalHeight = jsonFile["Altura Tela"];

            const widthScale = availableWidth / originalWidth;
            const heightScale = availableHeight / originalHeight;

            const scale = Math.min(widthScale, heightScale);

            return Math.max(0.3, Math.min(scale, 1.2));
        };

        const createHeatMap = (scale) => {
            if (jsonFile) {
                document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());

                const allCoords = combineCoordinates(dataFile, selectedTestIndex);

                const scaledCoords = allCoords.map((coord) => ({
                    x: parseFloat((coord.x * scale).toFixed(1)),
                    y: parseFloat((coord.y * scale).toFixed(1)),
                    value: 50,
                }));

                const canvasWidth = jsonFile["Largura Tela"] * scale;
                const canvasHeight = jsonFile["Altura Tela"] * scale;

                setCanvasSize({ width: canvasWidth, height: canvasHeight });
                setRadiusScale(scale);
                setCoords(scaledCoords);
            }
        };

        const responsiveScale = calculateResponsiveScale();
        createHeatMap(responsiveScale);
    }, [jsonFile, selectedTestIndex, windowSize, dataFile]);

    // Download function
    const downloadHeatMap = () => {
        if (!heatmapCanvasRef?.current || !imgRef?.current) {
            console.error("Algum dos refs necessários está faltando");

            return;
        }

        try {
            const overlayCanvas = heatmapCanvasRef.current.querySelector("canvas");
            const bubbleCanvas = canvasRef?.current;
            const finalCanvas = document.createElement("canvas");
            const finalContext = finalCanvas.getContext("2d");

            finalCanvas.width = canvasSize.width;
            finalCanvas.height = canvasSize.height;

            // Desenha a imagem de fundo
            if (imgRef.current) {
                finalContext.drawImage(
                    imgRef.current,
                    0,
                    0,
                    canvasSize.width,
                    canvasSize.height
                );
            }

            // Desenha o heatmap
            if (heatmapVisible) {
                finalContext.drawImage(overlayCanvas, 0, 0);
            }

            // Desenha as bolhas se estiverem visíveis
            if (canvasVisible) {
                finalContext.drawImage(bubbleCanvas, 0, 0);
            }

            const dataURL = finalCanvas.toDataURL("image/png");

            const link = document.createElement("a");
            link.href = dataURL;
            link.download = `Heatmap-${fileName || "download"}.png`;
            link.click();
        } catch (error) {
            console.error("Erro ao fazer download:", error);
        }
    };

    return {
        fileName,
        dataFile,
        jsonFile,
        img,
        imgRef,
        coords,
        radiusScale,
        canvasSize,
        done,
        windowSize,
        downloadHeatMap,
    };
};

export default useHeatmapData;