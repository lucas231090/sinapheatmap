const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  mediaPath: {
    type: String,
  },
  mediaType: {
    type: Number,
    default: 0, // 0 for image, 1 for video
  },
  description: {
    type: String,
  },
  path: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  jsonData: {
    type: Object,
    required: true,
  },
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
