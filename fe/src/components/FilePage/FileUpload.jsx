import { useRef, useState, useEffect } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFileContext } from "@/context/FileContext";
import { uploadHeatmap } from "@/services/fileService";

function FileUpload() {
  const { fetchData, showNotification } = useFileContext();

  const inputFile = useRef(null);
  const imageFile = useRef(null);
  const imageCSVRef = useRef();
  const imageIMGRef = useRef();

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [mediaThumbnail, setMediaThumbnail] = useState(null);

  const handleFileChange = (event, setFile, setName) => {
    const file = event.target.files[0];
    setFile(file);
    setName(file.name);

    // Se for um vídeo, gerar thumbnail
    if (file && file.type.startsWith("video/")) {
      generateVideoThumbnail(file);
    }
  };

  const generateVideoThumbnail = (videoFile) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const videoUrl = URL.createObjectURL(videoFile);

    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = 1;
    });

    video.addEventListener("seeked", () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          const thumbnailUrl = URL.createObjectURL(blob);
          setMediaThumbnail(thumbnailUrl);
          URL.revokeObjectURL(videoUrl); // Liberar URL do vídeo após gerar thumbnail
        },
        "image/jpeg",
        0.8,
      );
    });

    video.src = videoUrl;
  };

  const handleFileRemove = () => {
    if (selectedFile) {
      inputFile.current.value = "";
      setSelectedFile(null);
      setSelectedFileName("");
      setSelectedName("");
    }

    if (selectedImage) {
      imageFile.current.value = "";
      setSelectedImage(null);
      setSelectedImageName("");
    }

    // Limpar thumbnail e liberar memória
    if (mediaThumbnail) {
      URL.revokeObjectURL(mediaThumbnail);
      setMediaThumbnail(null);
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile || selectedName === "" || !selectedImage) {
      showNotification("Nenhum arquivo selecionado", "warning");
      return;
    }

    const submit = new FormData();
    submit.append("csvFile", selectedFile);
    submit.append("filename", selectedName);
    submit.append("mediaFile", selectedImage);
    submit.append("description", "Teste");

    try {
      await uploadHeatmap(submit);
      showNotification("Arquivo enviado com sucesso!", "success");
      fetchData(); // Atualiza a lista de arquivos
    } catch (err) {
      console.error(err.message);
      showNotification(
        err.message || "Erro ao fazer upload do arquivo",
        "error",
      );
    }

    handleFileRemove();
  };

  useEffect(() => {
    imageCSVRef.current.src = selectedFile ? "CsvFile.png" : "Upload.png";
  }, [selectedFile]);

  useEffect(() => {
    let imageObjectUrl = null;

    if (selectedImage) {
      if (selectedImage.type.startsWith("video/")) {
        imageIMGRef.current.src = mediaThumbnail || "Upload.png";
      } else {
        imageObjectUrl = URL.createObjectURL(selectedImage);
        imageIMGRef.current.src = imageObjectUrl;
      }
    } else {
      imageIMGRef.current.src = "Upload.png";
    }

    return () => {
      if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
    };
  }, [selectedImage, mediaThumbnail]);

  // Liberar URL da thumbnail ao desmontar o componente
  useEffect(() => {
    return () => {
      if (mediaThumbnail) URL.revokeObjectURL(mediaThumbnail);
    };
  }, [mediaThumbnail]);

  return (
    // White Box
    <div className="flex flex-col justify-center gap-10 bg-card dark:bg-darkcard p-4 rounded-lg shadow-md w-auto h-full">
      {/* Area de Input de Csv */}
      <div
        onClick={() => inputFile.current.click()}
        className="p-4 shadow-md rounded-lg bg-card2 dark:bg-darkcard2"
      >
        <div className="border-4 border-dashed  border-gray-300 dark:border-gray-100  rounded-lg p-4 flex flex-col items-center">
          <img
            ref={imageCSVRef}
            alt="upload"
            className="h-12 w-12 object-contain pb-2"
          />
          <h3 className="text-smallertext dark:text-darksmalltext">
            {selectedFileName || "Upload Arquivo .csv"}
          </h3>
          <input
            type="file"
            onChange={(event) =>
              handleFileChange(event, setSelectedFile, setSelectedFileName)
            }
            ref={inputFile}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />
        </div>
      </div>
      {/* Area de Input da Imagem */}
      <div
        className="p-4 shadow-md rounded-lg bg-card2 dark:bg-darkcard2"
        onClick={() => imageFile.current.click()}
      >
        <div className="border-4 border-dashed border-gray-300 dark:border-gray-100 rounded-lg p-4 flex flex-col items-center">
          <div className="relative">
            <img
              ref={imageIMGRef}
              alt="upload"
              className="h-12 w-12 object-contain pb-2"
            />
            {/* Indicador de vídeo */}
            {selectedImage && selectedImage.type.startsWith("video/") && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded">
                📹
              </div>
            )}
          </div>
          <h3 className="text-smallertext dark:text-darksmalltext">
            {selectedImageName || "Upload Arquivo de Imagem/Vídeo"}
          </h3>
          <input
            type="file"
            onChange={(event) =>
              handleFileChange(event, setSelectedImage, setSelectedImageName)
            }
            ref={imageFile}
            accept="image/*,video/*"
            className="hidden"
          />
        </div>
      </div>
      {/* Area do nome do Arquivo e apagar e enviar */}
      <div className="flex flex-col justify-center items-center md:items-start">
        <h2 className="text-title dark:text-darktitle font-bold py-2 ">
          Nome do Arquivo
        </h2>
        <div className="flex flex-col lg:flex-row w-full gap-2">
          <input
            type="text"
            className="px-2 py-1 flex-1 rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
          />
          <div className="flex flex-row gap-2 justify-center">
            <button
              className="bg-red-500 hover:bg-red-800 text-white px-4 py-2 rounded-lg"
              onClick={handleFileRemove}
            >
              <DeleteIcon />
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
              onClick={handleFileSubmit}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
