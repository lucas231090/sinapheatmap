import React, { useState, useRef } from "react";
import "./TestCard.css";
// Importação de ícones necessários para as ações do card
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
// Hook para navegação entre rotas
import { useNavigate } from "react-router-dom";
// Hook customizado para acessar o contexto de arquivos
import { useFileContext } from "../../../context/FileContext";

function TestCard({ file, callFunction, index }) {
  // Hook de navegação para redirecionar para a página de heatmap
  const navigate = useNavigate();
  // Extração das funções e variáveis necessárias do contexto
  const { fetchData, showNotification, API_BASE_URL } = useFileContext();

  // Referência para o input de arquivo
  const fileInputRef = useRef(null);

  // Estado para controlar se o card está em modo de edição
  const [isEditing, setIsEditing] = useState(false);
  // Estado para armazenar os dados editáveis do arquivo
  const [editedData, setEditedData] = useState({
    filename: file.filename,
    description: file.description,
  });
  // Estado para armazenar a nova imagem selecionada
  const [selectedImage, setSelectedImage] = useState(null);
  // Nome do arquivo de imagem para exibição
  const [selectedImageName, setSelectedImageName] = useState("");

  // Função para chamar a exclusão do arquivo (recebida via props)
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
      // Create base object for our request
      const updateData = {
        filename: editedData.filename,
        description: editedData.description,
      };

      // Remove the typo 'f' that was in your code
      // Fazer a requisição PUT com os dados do formulário
      const res = await fetch(`${API_BASE_URL}/heatmap/${file._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      // Verifica se a requisição foi bem-sucedida
      if (!res.ok) {
        throw new Error("Erro ao atualizar o arquivo");
      }

      console.log(res);

      // Exibe notificação de sucesso
      showNotification("Arquivo atualizado com sucesso!", "success");
      // Atualiza a lista de arquivos para refletir as mudanças
      fetchData();
      // Desativa o modo de edição
      setIsEditing(false);
      // Limpa a seleção de imagem
      setSelectedImage(null);
      setSelectedImageName("");
      // Limpa os dados editáveis
      setEditedData({
        filename: "",
        description: "",
      });
    } catch (err) {
      // Tratamento de erro com log no console e notificação ao usuário
      console.error("Erro ao atualizar arquivo:", err.message);
      showNotification(err.message, "error");
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
    <div className="flex flex-col gap-4 p-8 justify-center items-start rounded-lg shadow-md">
      {/* Área de informações/formulário de edição */}
      <div className="flex flex-col gap-2 justify-center items-start w-full">
        {isEditing ? (
          // Formulário de edição - mostrado quando isEditing é true
          <>
            <div className="w-full mb-2">
              <label className="text-gray-600">Nome:</label>
              <input
                type="text"
                name="filename"
                value={editedData.filename}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div className="w-full mb-2">
              <label className="text-gray-600">Descrição:</label>
              <input
                type="text"
                name="description"
                value={editedData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div className="w-full">
              <label className="text-gray-600">Nova imagem (opcional):</label>
              <div
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 cursor-pointer p-2 border border-dashed border-gray-300 rounded hover:bg-gray-50"
              >
                <ImageIcon color="action" />
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
            <h3 className="text-black font-bold">{file.filename}</h3>
            <p className="text-gray-500">
              <strong>Descrição:</strong> {file.description}
            </p>
            <p className="text-gray-500 text-start">
              <strong>Data de upload:</strong> {file.jsonData[0]["Data-Hora"]}
            </p>
          </>
        )}
      </div>

      {/* Área de botões de ação */}
      <div className="flex flex-col md:flex-row gap-2 justify-center md:justify-start w-full">
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
              className="bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
              onClick={handleEditClick}
            >
              <EditIcon /> Editar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-500 hover:bg-red-700 rounded-lg"
              onClick={() => handleClick()}
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
