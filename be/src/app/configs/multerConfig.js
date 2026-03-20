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

// Tipos de arquivo aceitos pelo sistema
const ALLOWED_EXTENSIONS = [
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".mp4",
  ".webm",
  ".avi",
  ".mov",
];

const fileFilter = (request, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${ext}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
