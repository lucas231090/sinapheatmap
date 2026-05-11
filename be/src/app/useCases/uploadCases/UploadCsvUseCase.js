/* eslint-disable no-unused-vars */
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const FileRepository = require("../../repositories/FileRepository");
const logger = require("../../configs/logger");
const { uploadsJsonDir } = require("../../configs/uploadsPaths");

class UploadCsvUseCase {
  async execute(file, filename, description) {
    if (!filename) {
      if (file) {
        fs.unlinkSync(file.path);
      }
      throw new Error("Nome do arquivo é obrigatório");
    }

    const results = [];
    const uploadDir = uploadsJsonDir;
    const jsonFilename = `${file.filename}.json`;
    const relativeJsonPath = path.join(uploadDir, jsonFilename);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileData = await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv({ separator: "," }))
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          try {
            const mappedResults = results.map((item) => {
              const { "Eixo X": x, "Eixo Y": y, Tempo: value, ...rest } = item;
              return { x, y, value, ...rest };
            });

            fs.writeFileSync(
              relativeJsonPath,
              JSON.stringify(mappedResults, null, 2),
            );

            const fileData = {
              filename,
              description,
              path: relativeJsonPath,
              jsonData: mappedResults,
            };

            await FileRepository.create(fileData);
            fs.unlinkSync(file.path);

            resolve(fileData);
          } catch (error) {
            logger.error(
              "Erro ao processar o arquivo CSV ou salvar no MongoDB: %s",
              error.message,
            );
            fs.unlinkSync(file.path);
            reject(new Error("Erro ao processar o arquivo CSV"));
          }
        })
        .on("error", (error) => {
          reject(new Error("Erro ao ler o arquivo CSV"));
        });
    });

    return fileData;
  }
}

module.exports = new UploadCsvUseCase();
