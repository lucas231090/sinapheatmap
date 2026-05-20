/* eslint-disable no-unused-vars */
const fs = require("fs");
const csv = require("csv-parser");

/**
 * UseCase for parsing and processing a CSV file containing HeatMap data.
 */
class ProcessCsvDataUseCase {
  /**
   * Reads a CSV file and parses its contents.
   * @param {string} filePath - The path to the CSV file.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of parsed CSV rows.
   */
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

  /**
   * Processes the raw CSV data into a structured format for the HeatMap.
   * @param {Array<Object>} data - The raw data parsed from the CSV.
   * @returns {Array<Object>} An array of processed data entries with coordinates.
   */
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
