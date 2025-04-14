import React, { useRef, useState, useEffect } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFileContext } from "../../context/FileContext";
import { uploadHeatmap } from "../../services/fileService";

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

  const handleFileChange = (event, setFile, setName) => {
    const file = event.target.files[0];
    setFile(file);
    setName(file.name);
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
        "error"
      );
    }

    handleFileRemove();
  };

  useEffect(() => {
    imageCSVRef.current.src = selectedFile ? "CsvFile.png" : "Upload.png";
  }, [selectedFile]);

  useEffect(() => {
    imageIMGRef.current.src = selectedImage
      ? URL.createObjectURL(selectedImage)
      : "Upload.png";
  }, [selectedImage]);

  return (
    // White Box
    <div className="flex flex-col justify-center gap-10 bg-white dark:bg-gray-600 p-4 rounded-lg shadow w-auto h-full">
      {/* Area de Input de Csv */}
      <div
        onClick={() => inputFile.current.click()}
        className="p-4 shadow-md rounded-xl dark:bg-gray-700"
      >
        <div className="border-4 border-dashed  border-gray-300 dark:border-gray-100  rounded-lg p-4 flex flex-col items-center">
          <img
            ref={imageCSVRef}
            alt="upload"
            className="h-12 w-12 object-contain pb-2"
          />
          <h3 className="text-bluegray dark:text-white">
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
        className="p-4 shadow-md rounded-xl dark:bg-gray-700"
        onClick={() => imageFile.current.click()}
      >
        <div className="border-4 border-dashed border-gray-300 dark:border-gray-100 rounded-lg p-4 flex flex-col items-center">
          <img
            ref={imageIMGRef}
            alt="upload"
            className="h-12 w-12 object-contain"
          />
          <h3 className="text-bluegray dark:text-white">
            {selectedImageName || "Upload Arquivo de Imagem"}
          </h3>
          <input
            type="file"
            onChange={(event) =>
              handleFileChange(event, setSelectedImage, setSelectedImageName)
            }
            ref={imageFile}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
      {/* Area do nome do Arquivo e apagar e enviar */}
      <div className="flex flex-col justify-center items-center md:items-start">
        <h2 className="text-gray-600 dark:text-white font-bold py-2 ">
          Nome do Arquivo
        </h2>
        <div className="flex flex-col lg:flex-row w-full gap-2">
          <input
            type="text"
            className="text-black border border-gray-300 dark:bg-white dark:border-gray-700 rounded px-2 py-1 flex-1"
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
