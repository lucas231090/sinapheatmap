import React from "react";

const TestSelector = ({
  dataFile,
  selectedTestIndex,
  setSelectedTestIndex,
}) => {
  if (!dataFile?.jsonData?.length || dataFile.jsonData.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <select
        className="p-2 border rounded bg-inputtext dark:bg-darkinputtext text-title dark:text-darktitle"
        value={selectedTestIndex}
        onChange={(e) => setSelectedTestIndex(e.target.value)}
      >
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
