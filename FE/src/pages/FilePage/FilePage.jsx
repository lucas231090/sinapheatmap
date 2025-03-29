import React, { useState, useEffect } from "react";
import FileUpload from "../../components/FilePage/FileUpload";
import FileList from "../../components/FilePage/FileList";
import CustomDialog from "../../components/General/CustomDialog";
import Notification from "../../components/General/Notification";

function FilePage() {
  const [modalIsOpen, setIsOpen] = useState({ open: false, id: "" });
  const [getFiles, setGetFiles] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });

    // Remove a notificação automaticamente após 5 segundos
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 5000);
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/eyetracking`);
      if (!res.ok) {
        throw new Error("Erro ao buscar os arquivos");
      }
      const data = await res.json();
      console.log("data", data);
      setGetFiles(data);
    } catch (err) {
      console.log("Erro ao buscar arquivos:", err.message);
      showNotification(err.message, "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const abrirModal = (id) => {
    setIsOpen({ open: true, id });
  };

  const fecharModal = async (confirm) => {
    if (confirm) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/eyetracking/${modalIsOpen.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ active: false }),
          }
        );

        if (!res.ok) {
          throw new Error("Erro ao atualizar visibilidade do arquivo");
        }

        console.log("Arquivo atualizado com sucesso");
        fetchData(); // Atualiza a lista após a exclusão
        showNotification("Arquivo atualizado com sucesso!", "success");
      } catch (err) {
        console.error("Erro ao excluir arquivo:", err.message);
        showNotification(err.message, "error");
      }
    }
    setIsOpen({ open: false, id: "" });
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      {/* Notificação */}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />

      {/* Custom Dialog */}
      <CustomDialog
        isOpen={modalIsOpen.open}
        onClose={() => fecharModal(false)}
        onConfirm={() => fecharModal(true)}
        title="Confirmação de Exclusão"
        message="Você tem certeza de que deseja excluir este arquivo?"
      />

      {/* Layout for FileUpload and FileList */}
      <div className="flex flex-row gap-4 w-full justify-center">
        <div className="w-1/2 2xl:w-200">
          <FileUpload
            fetchData={fetchData}
            showNotification={showNotification}
          />
        </div>
        <div className="w-1/2 2xl:w-200">
          <FileList
            getFiles={getFiles}
            abrirModal={abrirModal}
            showNotification={showNotification}
          />
        </div>
      </div>
    </div>
  );
}

export default FilePage;
