import React from "react";
import "./TestCard.css";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";

function TestCard({ file, callFunction }) {
  const navigate = useNavigate();

  function handleClick() {
    callFunction(file._id);
  }
  return (
    <div className="flex flex-col gap-4 p-8 justify-center  items-start  rounded-lg shadow-md">
      <div className="flex flex-col gap-2 justify-center items-start">
        <h3 className="text-black font-bold">{file.filename}</h3>
        <p className="text-gray-500">
          <strong>Descrição:</strong> {file.description}
        </p>
        <p className="text-gray-500 text-start">
          <strong>Data de upload:</strong> {file.jsonData[0]["Data-Hora"]}
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-2 justify-center md:justify-start w-full">
        <button
          className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded-lg"
          onClick={() => navigate(`eyeheatmap/${file._id}`)}
        >
          Ver Heatmap
        </button>
        <button className="bg-yellow-500 hover:bg-yellow-700 px-4 py-2 rounded-lg ">
          Editar
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-red-500 hover:bg-red-700 rounded-lg"
          onClick={() => handleClick()}
        >
          <DeleteIcon style={{ color: "white" }} />
        </button>
      </div>
    </div>
  );
}

export default TestCard;
