import React from "react";
import TestCard from "../FilePage/TestCard/TestCard";
import { useFileContext } from "../../context/FileContext";

function FileList({ getFiles, abrirModal }) {
  return (
    <div className="bg-white dark:bg-gray-600 p-4 rounded-lg shadow min-h-full h-130">
      <h2 className="text-black dark:text-white text-lg font-bold mb-4">
        Escolha um Arquivo
      </h2>
      <div className="flex flex-col gap-3 overflow-y-auto h-full max-h-110 ">
        {getFiles.length > 0 ? (
          getFiles.map((file, index) => (
            <div className="px-4" key={index}>
              <TestCard file={file} callFunction={abrirModal} index={index} />
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">Nenhum Teste Achado</p>
        )}
      </div>
    </div>
  );
}

export default FileList;
