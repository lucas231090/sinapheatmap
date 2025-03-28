import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import FileUpload from "../../components/FilePage/FileUpload";
import FileList from "../../components/FilePage/FileList";

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
      console.log("A", err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const abrirModal = (id) => {
    setIsOpen({ open: true, id });
  };

  const fecharModal = (value) => {
    if (value) {
      // Lógica para deletar o arquivo
    }
    setIsOpen({ open: false, id: "" });
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      <Modal
        isOpen={modalIsOpen.open}
        onRequestClose={fecharModal}
        contentLabel="Modal de exemplo"
        className="modal"
      >
        <div className="modal-inside">
          <h2>Você quer mesmo deletar esse arquivo?</h2>
          <div className="button-row">
            <button className="no" onClick={() => fecharModal(false)}>
              Não
            </button>
            <button className="submit" onClick={() => fecharModal(true)}>
              Sim
            </button>
          </div>
        </div>
      </Modal>
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
