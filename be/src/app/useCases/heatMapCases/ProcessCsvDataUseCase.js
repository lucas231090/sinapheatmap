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
    if (!data || data.length === 0) {
      return { sessions: [], screenWidth: 1280, screenHeight: 720 };
    }

    let globalWidth = 1280;
    let globalHeight = 720;

    const parsedWidth = parseFloat(data[0]["Largura Tela"] || data[0]["largura tela"] || data[0]["Largura"]);
    const parsedHeight = parseFloat(data[0]["Altura Tela"] || data[0]["altura tela"] || data[0]["Altura"]);

    if (!isNaN(parsedWidth)) globalWidth = parsedWidth;
    if (!isNaN(parsedHeight)) globalHeight = parsedHeight;

    const sessions = data.map((entry) => {
      const rawX = entry["Eixo X"] || "";
      const rawY = entry["Eixo Y"] || "";

      const rawLargura = entry["Largura Tela"] || entry["largura tela"] || entry["Largura"] || String(globalWidth);
      const rawAltura = entry["Altura Tela"] || entry["altura tela"] || entry["Altura"] || String(globalHeight);
      
      const larguraArr = rawLargura.includes(";") ? rawLargura.split(";") : [];
      const alturaArr = rawAltura.includes(";") ? rawAltura.split(";") : [];

      const xCoords = rawX.split(";").map((val, index) => {
        const num = parseFloat(val);
        if (isNaN(num)) return null;
        
        // If coordinate is normalized (0 to 1) and we have width
        if (num >= 0 && num <= 1) {
            const width = larguraArr.length > index ? parseFloat(larguraArr[index]) : parseFloat(rawLargura);
            if (!isNaN(width)) {
                return num * width;
            }
        }
        return num;
      });

      const yCoords = rawY.split(";").map((val, index) => {
        const num = parseFloat(val);
        if (isNaN(num)) return null;
        
        // If coordinate is normalized (0 to 1) and we have height
        if (num >= 0 && num <= 1) {
            const height = alturaArr.length > index ? parseFloat(alturaArr[index]) : parseFloat(rawAltura);
            if (!isNaN(height)) {
                return num * height;
            }
        }
        return num;
      });

      const coordinates = xCoords.map((x, index) => ({
        x: x !== null ? x : null,
        y: yCoords[index] !== null ? yCoords[index] : null,
      })).filter((c) => c.x !== null && c.y !== null);

      const { "Eixo X": _, "Eixo Y": __, Tempo: ___, ...rest } = entry;

      return {
        ...rest,
        coordinates,
      };
    });

    return { sessions, screenWidth: globalWidth, screenHeight: globalHeight };
  }
}

module.exports = new ProcessCsvDataUseCase();
