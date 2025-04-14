import React from "react";
import TestCard from "../FilePage/TestCard/TestCard";
import { useFileContext } from "../../context/FileContext";

function FileList({ getFiles, abrirModal }) {
  return (
    <div className="bg-card dark:bg-darkcard p-4 rounded-lg shadow min-h-full h-130">
      <h2 className="text-title dark:text-darktitle text-lg font-bold mb-4">
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
          <p className="text-smallertext dark:text-darksmallertext text-center">
            Nenhum Teste Achado
          </p>
        )}
      </div>
    </div>
  );
}

export default FileList;
