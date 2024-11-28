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
      const xCoords = entry["Eixo X"].split(";").map(Number);
      const yCoords = entry["Eixo Y"].split(";").map(Number);

      const coordinates = xCoords.map((x, index) => ({
        x,
        y: yCoords[index],
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
