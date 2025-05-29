import React from "react";

/**
 * Componente genérico para seleção de testes
 * Usado tanto na visualização estática quanto no vídeo
 */
const TestSelector = ({
  dataFile,
  selectedTestIndex,
  setSelectedTestIndex,
  disabled = false,
  allowSingleTest = false, // Nova prop para permitir mostrar quando há apenas um teste
}) => {
  // Se não há dados ou não há testes suficientes (e não permite teste único), retorna null
  if (
    !dataFile?.jsonData?.length ||
    (dataFile.jsonData.length <= 1 && !allowSingleTest)
  ) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <select
        className={`p-2 border rounded bg-inputtext dark:bg-darkinputtext text-title dark:text-darktitle ${
          disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
        }`}
        value={selectedTestIndex}
        onChange={(e) => setSelectedTestIndex(e.target.value)}
        disabled={disabled}
      >
        <option value="">-- Selecione um teste --</option>
        <option value="all">Combine All Tests</option>
        {dataFile.jsonData.map((_, index) => (
          <option key={index} value={index}>
            Test {index + 1}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TestSelector;
