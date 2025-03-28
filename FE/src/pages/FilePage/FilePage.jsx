import React, { useState, useEffect } from "react";
import FileUpload from "../../components/FilePage/FileUpload";
import FileList from "../../components/FilePage/FileList";
import CustomDialog from "../../components/General/CustomDialog";

function FilePage() {
  const [modalIsOpen, setIsOpen] = useState({ open: false, id: "" });
  const [getFiles, setGetFiles] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/eyetracking`);
      const data = await res.json();
      console.log("data", data);
      setGetFiles(data);
    } catch (err) {
      console.log("Erro ao buscar arquivos:", err.message);
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
      } catch (err) {
        console.error("Erro ao excluir arquivo:", err.message);
      }
    }
    setIsOpen({ open: false, id: "" });
  };

  return (
    <div className="flex flex-col gap-4 p-8">
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
          <FileUpload fetchData={fetchData} />
        </div>
        <div className="w-1/2 2xl:w-200">
          <FileList getFiles={getFiles} abrirModal={abrirModal} />
        </div>
      </div>
    </div>
  );
}

export default FilePage;
