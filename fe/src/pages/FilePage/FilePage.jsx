import React from "react";
import FileUpload from "../../components/FilePage/FileUpload";
import FileList from "../../components/FilePage/FileList";
import CustomDialog from "../../components/General/CustomDialog";
import Notification from "../../components/General/Notification";
import { useFilePage } from "../../hooks/useFilePage";

function FilePage() {
  const {
    modalIsOpen,
    getFiles,
    notification,
    abrirModal,
    fecharModal,
    showNotification,
  } = useFilePage();

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
