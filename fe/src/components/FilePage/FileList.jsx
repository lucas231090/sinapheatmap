import React from "react";
import TestCard from "../FilePage/TestCard/TestCard";

function FileList({ getFiles, abrirModal }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow h-full">
      <h2 className="text-black text-lg font-bold mb-4">Escolha um Arquivo</h2>
      <div className="flex flex-col gap-3 overflow-y-auto h-100">
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
