const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  mediaPath: {
    type: String,
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
