const path = require("path");

function sanitizePath(filename) {
  return path.basename(filename);
}

module.exports = sanitizePath;
