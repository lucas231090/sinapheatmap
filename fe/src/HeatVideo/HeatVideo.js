import React, { useEffect, useRef, useState } from 'react';
import h337 from 'heatmap.js';
import './HeatVideo.css';

const VideoHeatmap = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const heatmapContainerRef = useRef(null);
    const heatmapInstance = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);
    const [isRecording, setIsRecording] = useState(false);
    const [downloadLink, setDownloadLink] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [videoDuration, setVideoDuration] = useState(0); // Store the video duration
    const [currentTime, setCurrentTime] = useState(0); // Store the current time

    const fps = 120;
    const framesPerPoint = 1;
    let lastFrameTime = 0;

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawFrame = () => {
            if (video.paused || video.ended) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const overlayCanvas = document.querySelectorAll('.heatmap-canvas')[0];
            if (overlayCanvas) {
                ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
            }

            requestAnimationFrame(drawFrame);
        };

        const addHeatmapPoint = (currentTime) => {
            const width = heatmapContainerRef.current.offsetWidth;
            const height = heatmapContainerRef.current.offsetHeight;

            const newPoint = {
                x: Math.floor(Math.random() * width),
                y: Math.floor(Math.random() * height),
                value: Math.floor(Math.random() * 100),
            };

            setHeatmapData((prevData) => [...prevData, newPoint]);
        };

        const updateHeatmapBasedOnFrames = () => {
            const currentTime = video.currentTime;
            setCurrentTime(currentTime); // Update the current time for the progress bar
            const currentFrame = Math.floor(currentTime * fps);

            if (currentFrame - lastFrameTime >= framesPerPoint) {
                addHeatmapPoint(currentTime);
                lastFrameTime = currentFrame;
            }
        };

        video.addEventListener('timeupdate', updateHeatmapBasedOnFrames);
        video.addEventListener('loadedmetadata', () => setVideoDuration(video.duration)); // Set video duration when metadata loads
        video.addEventListener('ended', stopRecording);

        if (isRecording) {
            video.play();
            drawFrame();
        }

        return () => {
            video.removeEventListener('timeupdate', updateHeatmapBasedOnFrames);
            video.removeEventListener('loadedmetadata', () => setVideoDuration(video.duration));
            video.removeEventListener('ended', stopRecording);
        };
    }, [isRecording]);

    useEffect(() => {
        if (heatmapInstance.current && heatmapData.length > 0) {
            heatmapInstance.current.setData({
                max: 100,
                data: heatmapData,
            });
        }
    }, [heatmapData]);

    const startRecording = () => {
        const canvas = canvasRef.current;
        const stream = canvas.captureStream();
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setDownloadLink(url);
            recordedChunks.current = [];
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
    };

    const handlePlayClick = () => {
        const video = videoRef.current;
        heatmapInstance.current = h337.create({
            container: heatmapContainerRef.current,
            radius: 40,
            maxOpacity: 0.6,
            minOpacity: 0.4,
            blur: 0.7,
        });
        document.querySelectorAll('.heatmap-canvas')[0].style.visibility = 'hidden';
        heatmapContainerRef.current.style.position = 'absolute';
        video.play();
        startRecording();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className='body-video'>
            <canvas
                ref={canvasRef}
                width="800"
                height="450"
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', visibility: 'hidden' }}
            ></canvas>

            <div
                ref={heatmapContainerRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '800px',
                    height: '450px',
                    pointerEvents: 'none',
                    visibility: 'hidden',
                }}
            ></div>

            <video
                ref={videoRef}
                src="Teste.mp4"
                muted
                style={{ display: 'none', position: 'absolute' }}
            />

            <div className='white-box'>
                {!isRecording ? (
                    <div className='button-box'>
                        <div>
                            <button className='submit' onClick={handlePlayClick}>Start Recording</button>
                        </div>
                    </div>
                ) : (
                    <div className='Video-box'>
                        <div className='button-box'>
                            <button className='loading-btn' disabled>Recording</button>
                        </div>
                        <div>
                            <progress id="file" max={videoDuration} value={currentTime}></progress>
                        </div>
                    </div>
                )}

                {downloadLink && (
                    <div className='Video-box padding'>
                        <a href={downloadLink} download="canvas-recording.webm">
                            Download Recording
                        </a>
                        <video src={downloadLink} controls></video>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoHeatmap;
