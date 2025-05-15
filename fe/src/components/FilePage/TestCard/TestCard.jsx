import React, { useState, useRef } from "react";
import "./TestCard.css";
// Importação de ícones necessários para as ações do card
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
// Hook para navegação entre rotas e hook customizado para o contexto de arquivos
import { useNavigate } from "react-router-dom";
import { useFileContext } from "../../../context/FileContext";

// Serviço para operações de arquivos
import { updateFile } from "../../../services/fileService";

function TestCard({ file, callFunction, index }) {
  // navigate: Hook para navegação entre rotas
  // [fetchData, showNotification]: Funções e variáveis do contexto de arquivos
  // fileInputRef: Referência para o input de arquivo
  // isEditing: Estado para controlar se o card está em modo de edição
  // editedData: Estado para armazenar os dados editáveis do arquivo
  // selectedImage: Estado para armazenar a imagem selecionada
  // selectedImageName: Estado para armazenar o nome da imagem selecionada
  const navigate = useNavigate();
  const { fetchData, showNotification } = useFileContext();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    filename: file.filename,
    description: file.description,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState("");

  // Manipula o clique no botão de exclusão
  function handleClick() {
    callFunction(file._id);
  }

  // Ativa o modo de edição do card
  function handleEditClick() {
    setIsEditing(true);
  }

  // Cancela o modo de edição e restaura os dados originais
  function handleCancelEdit() {
    setIsEditing(false);
    setEditedData({
      filename: file.filename,
      description: file.description,
    });
    setSelectedImage(null);
    setSelectedImageName("");
  }

  // Manipula a seleção de um novo arquivo de imagem
  function handleImageChange(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setSelectedImageName(file.name);
    }
  }

  // Salva as alterações feitas no arquivo
  async function handleSaveEdit() {
    try {
      // Objeto com os dados atualizados do arquivo
      const updateData = {
        filename: editedData.filename,
        description: editedData.description,
      };

      // Chama o serviço para atualizar o arquivo no backend
      await updateFile(file._id, updateData);

      // Exibe notificação de sucesso e Atualiza a lista de arquivos para refletir as mudanças
      // Desativa o modo de edição e Limpa a seleção de imagem, nome da imagem e dados editáveis
      showNotification("Arquivo atualizado com sucesso!", "success");
      fetchData();
      setIsEditing(false);
      setSelectedImage(null);
      setSelectedImageName("");
      setEditedData({
        filename: "",
        description: "",
      });
    } catch (err) {
      // Tratamento de erro com log no console e notificação ao usuário
      console.error("Erro ao atualizar arquivo:", err.message);
      showNotification(err.message || "Erro ao atualizar o arquivo", "error");
    }
  }

  // Atualiza o estado dos dados sendo editados conforme o usuário digita
  function handleInputChange(e) {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div className="flex flex-col gap-4 p-8 justify-center items-start rounded-lg shadow-md h-full bg-card2 dark:bg-darkcard2">
      {/* Área de informações/formulário de edição */}
      <div className="flex flex-col gap-2 justify-center items-start w-full">
        {isEditing ? (
          // Formulário de edição - mostrado quando isEditing é true
          <>
            <div className="w-full mb-2">
              <label
                htmlFor="filename"
                className="text-smalltext dark:text-darksmalltext"
              >
                Nome:
              </label>
              <input
                id="filename"
                type="text"
                name="filename"
                value={editedData.filename}
                onChange={handleInputChange}
                className="w-full px-2 py-1 rounded-lg shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext "
              />
            </div>
            <div className="w-full mb-2">
              <label
                htmlFor="description"
                className="text-smalltext dark:text-darksmalltext"
              >
                Descrição:
              </label>
              <input
                id="description"
                type="text"
                name="description"
                value={editedData.description}
                onChange={handleInputChange}
                className="w-full px-2 py-1 rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext"
              />
            </div>
            <div className="w-full">
              <label className="text-smalltext dark:text-darksmalltext">
                Nova imagem (opcional):
              </label>
              <div
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 cursor-pointer rounded-md  p-2 border border-dashed border-inputtextborder dark:border-darkinputtextborder bg-inputtext hover:bg-inputfilehover dark:bg-darkinputtext dark:hover:bg-darkinputfilehover text-inputtextdarktext dark:text-darkinputtextdarktext"
              >
                <ImageIcon color="white" />
                <span>
                  {selectedImageName || "Clique para selecionar uma imagem"}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </>
        ) : (
          // Exibição das informações - mostrada quando não está editando
          <>
            <h3 className="text-title dark:text-darktitle font-bold">
              {file.filename}
            </h3>
            <p className="text-smalltext dark:text-darksmalltext ">
              <strong>Descrição:</strong> {file.description}
            </p>
            <p className="text-smalltext dark:text-darksmalltext text-start">
              <strong>Data de upload:</strong> {file.jsonData[0]["Data-Hora"]}
            </p>
          </>
        )}
      </div>

      {/* Área de botões de ação */}
      <div className="flex flex-col lg:flex-row gap-2  justify-center md:justify-start w-full">
        {isEditing ? (
          // Botões para o modo de edição
          <>
            <button
              className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              onClick={handleSaveEdit}
            >
              <SaveIcon /> Salvar
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              onClick={handleCancelEdit}
            >
              <CloseIcon /> Cancelar
            </button>
          </>
        ) : (
          // Botões para o modo de visualização
          <>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              onClick={() => navigate(`eyeheatmap/${file._id}`)}
            >
              Ver Heatmap
            </button>
            <button
              className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              onClick={() => navigate(`heatmap-video/${file._id}`)}
            >
              Video
            </button>
            <button
              className="bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
              onClick={handleEditClick}
            >
              <EditIcon /> Editar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-500 hover:bg-red-700 rounded-lg"
              onClick={() => handleClick()}
              aria-label="Excluir"
            >
              <DeleteIcon style={{ color: "white" }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TestCard;
