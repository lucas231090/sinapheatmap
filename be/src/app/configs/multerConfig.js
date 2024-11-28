const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (request, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (request, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (request, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".csv" || ext != ".csv") {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos .csv são permitidos"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
