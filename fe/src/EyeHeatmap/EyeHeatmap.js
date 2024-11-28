import React, { useEffect, useState, useRef } from "react";
import { useParams } from 'react-router-dom';
import h337 from "heatmap.js";
import './EyeHeatmap.css';

function Eyeheatmap() {
    const { id } = useParams();
    const [flag, setFlag] = useState(false);
    const [img, setImg] = useState('')
    const [fileName, setFileName] = useState()
    const [dataFile, setDataFile] = useState();
    const [coords, setCoords] = useState([]);
    const [radiusScale, setRadiusScale] = useState(1);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // Estado para o tamanho do canvas
    const imgRef = useRef(null);

    // Busca os arquivos dos testes uma vez
    const fetchData = async () => {
        try {
            const res = await fetch(`http://localhost:3333/eyetracking/${id}`);
            const data = await res.json();
            console.log(data);
            setFileName(data.filename)

            if (data.jsonData.length !== 0) {
                setDataFile(data.jsonData[0]);
            } else if (data.length !== 0) {
                setDataFile(data);
            }

            if (data.mediaPath !== null) {
                const mediaPath = data.mediaPath;
                const imgName = mediaPath.split('/').pop();
                const imageRes = await fetch(`http://localhost:3333/uploads/media/${imgName}`);
                const imageResBlob = await imageRes.blob();
                const imageResUrl = URL.createObjectURL(imageResBlob);
                console.log(imageResUrl);
                setImg(imageResUrl)
            } else {
                console.log('No media file found');
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

    const createHeatMap = (scale) => {
        if (dataFile) {

            // Remove o canvas anterior
            document.querySelectorAll('.heatmap-canvas').forEach(e => e.remove());

            // Modifica as coordenadas de forma imutável
            if (dataFile.coordinates === undefined) {
                const coords = transformToCoordinates(dataFile.x, dataFile.y);
                dataFile.coordinates = coords;
            }
            const scaledCoords = dataFile.coordinates.map(coord => ({
                x: coord.x * scale,
                y: coord.y * scale,
            }));

            const canvasWidth = (dataFile["Largura Tela"]) * scale * 1.1;
            const canvasHeight = (dataFile["Altura Tela"]) * scale * 1.1;

            // Atualiza o estado do tamanho do canvas e as coordenadas
            setCanvasSize({ width: canvasWidth, height: canvasHeight });
            setRadiusScale(scale);
            setCoords(scaledCoords);
        }
    };

    const downloadHeatMap = () => {
        console.log('Image', img);

        // A ideia é criar um canvas novo (nao colocando na tela) e baixar como imagem esse novo canvas
        // Pega o canvas do heatmap e cria um novo canvas
        const overlayCanvas = document.querySelectorAll('.heatmap-canvas')[0];
        const finalCanvas = document.createElement('canvas');
        const finalContext = finalCanvas.getContext('2d');

        // Coloca as dimensoes do heatmap nesse novo canvas
        finalCanvas.width = canvasSize.width;
        finalCanvas.height = canvasSize.height;

        // Coloca a imagem nesse novo canvas
        finalContext.drawImage(imgRef.current, 0, 0, canvasSize.width, canvasSize.height); // Using imgRef.current

        // Desenha o heatmap emcima do canvas
        finalContext.drawImage(overlayCanvas, 0, 0);

        // Cria a Imagem do Canvas
        const dataURL = finalCanvas.toDataURL('image/png');

        // Cria um link (nao colocando na tela) e clica nele para baixar o heatmap
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `Heatmap-${fileName}.png`;
        link.click();
    }


    // Chama fetchData apenas uma vez na montagem do componente
    useEffect(() => {
        if (!flag) {
            fetchData();
            setFlag(true);
        }
    }, [id]); // 'id' como dependência

    useEffect(() => {
        createHeatMap(1)
    }, [dataFile]); // 'id' como dependência

    // Criação do heatmap quando coords ou canvasSize mudar
    useEffect(() => {
        if (coords.length > 0 && canvasSize.width > 0 && canvasSize.height > 0) {
            const heatmapInstance = h337.create({
                container: document.querySelector('.heatmapContainer'),
                maxOpacity: 1,
                radius: Math.max(10, 50 * radiusScale),
                blur: 0.9,
                backgroundColor: 'rgba(255, 255, 255, 0)',
            });
            console.log(coords);


            heatmapInstance.setData({
                data: coords, // Define os dados do heatmap
            });

            console.log("Heatmap created with radiusScale:", radiusScale);
        }
    }, [coords, canvasSize, radiusScale]); // Dependências adequadas

    return (
        <div className='body'>
            <div>
                <div className="controls">
                    <strong className="text">Escala</strong>
                    <span className="text">{radiusScale}</span>

                    <input
                        id="scale-slider"
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.5"
                        value={radiusScale}
                        onChange={(e) => createHeatMap(parseFloat(e.target.value))}
                    />
                    <button className="scale-btn" onClick={() => downloadHeatMap()}>
                        Download
                    </button>
                </div>
            </div>

            <div className="white-area">
                {canvasSize.width > 0 && canvasSize.height > 0 && (
                    <div>
                        <div className='heatmapContainer' style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}>
                            {img ? (
                                <img
                                    ref={imgRef}
                                    src={img}
                                    crossOrigin="anonymous"
                                    className="image-area"
                                    style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
                                />
                            ) : <div></div>}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

export default Eyeheatmap;
