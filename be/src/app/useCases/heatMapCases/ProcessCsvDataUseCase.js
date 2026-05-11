/* eslint-disable no-unused-vars */
const fs = require("fs");
const csv = require("csv-parser");

class ProcessCsvDataUseCase {
  execute(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv({ separator: "," }))
        .on("data", (data) => results.push(data))
        .on("end", () => {
          resolve(results);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  processHeatmapData(data) {
    return data.map((entry) => {
      const rawX = entry["Eixo X"] || "";
      const rawY = entry["Eixo Y"] || "";

      const xCoords = rawX.split(";").map((val) => {
        const cleaned = val.split(".")[0];
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      });

      const yCoords = rawY.split(";").map((val) => {
        const cleaned = val.split(".")[0];
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      });

      const coordinates = xCoords.map((x, index) => ({
        x: x ?? null,
        y: yCoords[index] ?? null,
      }));

      const { "Eixo X": _, "Eixo Y": __, Tempo: ___, ...rest } = entry;

      return {
        ...rest,
        coordinates,
      };
    });
  }
}

module.exports = new ProcessCsvDataUseCase();
