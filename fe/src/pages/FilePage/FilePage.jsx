import React, { useState } from "react";
import FileUpload from "../../components/FilePage/FileUpload";
import FileList from "../../components/FilePage/FileList";
import CustomDialog from "../../components/General/CustomDialog";
import Notification from "../../components/General/Notification";
import { useFileContext } from "../../context/FileContext";
import { deactivateFile } from "../../services/fileService";

function FilePage() {
  const [modalIsOpen, setIsOpen] = useState({ open: false, id: "" });
  const {
    files: getFiles,
    fetchData,
    showNotification,
    notification,
  } = useFileContext();

  const abrirModal = (id) => {
    setIsOpen({ open: true, id });
  };

  const fecharModal = async (confirm) => {
    if (confirm) {
      try {
        await deactivateFile(modalIsOpen.id);

        console.log("Arquivo atualizado com sucesso");
        fetchData(); // Atualiza a lista após a exclusão
        showNotification("Arquivo atualizado com sucesso!", "success");
      } catch (err) {
        console.error("Erro ao excluir arquivo:", err.message);
        showNotification(
          err.message || "Erro ao atualizar visibilidade do arquivo",
          "error"
        );
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
        onClose={() => showNotification("", "")}
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
