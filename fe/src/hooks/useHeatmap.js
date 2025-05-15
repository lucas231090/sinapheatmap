import { useState, useEffect } from "react";
import { getFileById, getFileMedia } from "../services/fileService";
import { combineCoordinates, calculateResponsiveScale, downloadHeatMap as downloadHeatMapService } from "../services/heatmapService";
import config from "../../config";

/**
 * Hook centralizado para gerenciar dados de heatmap
 * Pode ser usado tanto pela visualização estática quanto pelo vídeo
 */
const useHeatmap = (id, selectedTestIndex, canvasRef, heatmapCanvasRef, imgRef, heatmapVisible, canvasVisible) => {
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

    // Process data and create heatmap when data changes
    useEffect(() => {
        // Função para criar o heatmap
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

        const responsiveScale = calculateResponsiveScale(jsonFile, windowSize);
        createHeatMap(responsiveScale);
    }, [jsonFile, selectedTestIndex, windowSize, dataFile]);

    // Download function
    const downloadHeatMap = () => {
        downloadHeatMapService({
            heatmapCanvasRef,
            canvasRef,
            imgRef,
            canvasSize,
            heatmapVisible,
            canvasVisible,
            fileName
        });
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

export default useHeatmap;
