import { useState, useEffect } from "react";
import { getFileById, getFileMedia } from "../../../services/fileService";
import config from "../../../../config";


const useHeatmapData = (id, selectedTestIndex, canvasRef, heatmapCanvasRef, imgRef, heatmapVisible, canvasVisible) => {
    const API_BASE_URL = config.API_BASE_URL;

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

        // Substitua a função combineCoordinates por esta versão mais robusta:
        const combineCoordinates = (dataFiles, selectedIndex) => {
            console.log("Combinando coordenadas com selectedIndex:", selectedIndex);

            let combinedCoords = [];

            // Verificações de segurança para dados
            if (!dataFiles || !dataFiles.jsonData || !Array.isArray(dataFiles.jsonData)) {
                console.warn("Dados JSON não válidos");
                return [];
            }

            try {
                if (selectedIndex === "all") {
                    // Combine todos os testes
                    dataFiles.jsonData.forEach((dataItem, index) => {
                        if (!dataItem) {
                            console.warn("Teste", index, "é undefined");
                            return;
                        }

                        if (dataItem.coordinates && Array.isArray(dataItem.coordinates)) {
                            console.log(`Adicionando ${dataItem.coordinates.length} coordenadas do teste ${index}`);
                            combinedCoords = combinedCoords.concat(dataItem.coordinates);
                        } else if (dataItem.x && dataItem.y) {
                            const coords = transformToCoordinates(dataItem.x, dataItem.y);
                            combinedCoords = combinedCoords.concat(coords);
                        } else {
                            console.warn(`Teste ${index} não tem coordenadas válidas`);
                        }
                    });
                } else {
                    // Verifica se é um número válido
                    const index = parseInt(selectedIndex, 10);

                    if (isNaN(index)) {
                        console.warn("selectedIndex não é um número válido:", selectedIndex);
                        return [];
                    }

                    // Verifica se o índice está dentro dos limites
                    if (index < 0 || index >= dataFiles.jsonData.length) {
                        console.warn("Índice fora dos limites:", index, "para array de tamanho", dataFiles.jsonData.length);
                        return [];
                    }

                    const dataItem = dataFiles.jsonData[index];

                    if (!dataItem) {
                        console.warn("Teste", index, "é undefined");
                        return [];
                    }

                    if (dataItem.coordinates && Array.isArray(dataItem.coordinates)) {
                        console.log(`Usando ${dataItem.coordinates.length} coordenadas do teste ${index}`);
                        combinedCoords = dataItem.coordinates;
                    } else if (dataItem.x && dataItem.y) {
                        combinedCoords = transformToCoordinates(dataItem.x, dataItem.y);
                    } else {
                        console.warn(`Teste ${index} não tem coordenadas válidas`);
                    }
                }
            } catch (error) {
                console.error("Erro ao combinar coordenadas:", error);
            }

            console.log(`Retornando ${combinedCoords.length} coordenadas combinadas`);
            return combinedCoords;
        };

        const calculateResponsiveScale = () => {
            if (!jsonFile) return 1;

            const availableWidth = windowSize.width;
            const availableHeight = windowSize.height;

            const originalWidth = jsonFile["Largura Tela"];
            const originalHeight = jsonFile["Altura Tela"];

            const widthScale = Math.round(availableWidth / originalWidth);
            const heightScale = Math.round(availableHeight / originalHeight);

            const scale = Math.min(widthScale, heightScale);

            return scale / 2;
        };

        // E também atualize a função createHeatMap para garantir valores válidos:
        const createHeatMap = (scale) => {
            if (!jsonFile) {
                console.warn("jsonFile não está disponível");
                return;
            }

            try {
                document.querySelectorAll(".heatmap-canvas").forEach((e) => e.remove());

                // Obtenha as coordenadas de forma segura
                const allCoords = combineCoordinates(dataFile, selectedTestIndex);

                // Verifique se temos coordenadas
                if (!allCoords || allCoords.length === 0) {
                    console.warn("Nenhuma coordenada disponível para visualização");
                    setCoords([]);
                    return;
                }

                // Parse para garantir que temos números válidos
                const canvasWidth = parseFloat(jsonFile["Largura Tela"]) * scale || 1280;
                const canvasHeight = parseFloat(jsonFile["Altura Tela"]) * scale || 720;

                // Verifique se scale é um número razoável
                if (isNaN(scale) || scale <= 0 || scale > 10) {
                    console.warn("Escala inválida:", scale, "usando 1.0");
                    scale = 1.0;
                }

                // Verificação adicional nas coordenadas
                const scaledCoords = allCoords
                    .filter(coord => {
                        // Verifica se x e y são números válidos
                        const isValid = coord &&
                            typeof coord.x === 'number' && !isNaN(coord.x) &&
                            typeof coord.y === 'number' && !isNaN(coord.y);

                        if (!isValid) {
                            console.warn("Coordenada inválida descartada:", coord);
                        }

                        return isValid;
                    })
                    .map((coord) => ({
                        x: Math.round(coord.x * scale),
                        y: Math.round(coord.y * scale),
                        value: 50,
                    }));

                console.log(`Coordenadas escaladas: ${scaledCoords.length} de ${allCoords.length} originais`);

                setCanvasSize({ width: canvasWidth, height: canvasHeight });
                setRadiusScale(scale);
                setCoords(scaledCoords);
            } catch (error) {
                console.error("Erro ao criar heatmap:", error);
                setCoords([]);
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