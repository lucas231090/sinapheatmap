import React, { useState } from "react";
import FileUpload from "../../components/FilePage/FileUpload";
import FileList from "../../components/FilePage/FileList";
import CustomDialog from "../../components/General/CustomDialog";
import Notification from "../../components/General/Notification";
import { useFileContext } from "../../context/FileContext";

function FilePage() {
  const [modalIsOpen, setIsOpen] = useState({ open: false, id: "" });
  const {
    files: getFiles,
    fetchData,
    showNotification,
    notification,
    API_BASE_URL,
  } = useFileContext();

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
          <FileUpload />
        </div>
        <div className="w-1/2 2xl:w-200">
          <FileList getFiles={getFiles} abrirModal={abrirModal} />
        </div>
      </div>
    </div>
  );
}

export default FilePage;
