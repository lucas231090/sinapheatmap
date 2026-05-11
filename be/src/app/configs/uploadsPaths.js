const path = require("path");

// Uploads should live outside `src/` so they don't get committed by accident.
// This resolves to `<repo>/sinapheatmap/be/uploads`
const uploadsRoot = path.resolve(__dirname, "../../../uploads");

const uploadsTmpDir = path.join(uploadsRoot, "tmp");
const uploadsJsonDir = path.join(uploadsRoot, "json");
const uploadsMediaDir = path.join(uploadsRoot, "media");

module.exports = {
  uploadsRoot,
  uploadsTmpDir,
  uploadsJsonDir,
  uploadsMediaDir,
};
