const path = require("path");
const { Router } = require("express");
const routeAdapter = require("./routeAdapter");
//const authMiddleware = require("../middlewares/auth");
const SignInController = require("../controllers/SignInController");
const SignUpController = require("../controllers/SignUpController");
const CsvController = require("../controllers/CsvController");
const EyeTrackingController = require("../controllers/EyeTrackingController");
const HeatMapController = require("../controllers/HeatMapController");
const MockDataController = require("../controllers/MockDataController");

const routes = Router();

routes.post("/sign-in", routeAdapter(SignInController));
routes.post("/sign-up", routeAdapter(SignUpController));

//routes.use(authMiddleware);

routes.get("/data-mock", MockDataController.getData);
routes.post("/upload", CsvController.store);
routes.post("/heatmap", HeatMapController.store);
routes.get("/eyetracking", EyeTrackingController.index);
routes.get("/eyetracking/:_id", EyeTrackingController.show);
routes.put("/eyetracking/:_id", EyeTrackingController.updateActiveStatus);

routes.get("/uploads/media/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "../uploads/media",
    req.params.filename
  );
  res.sendFile(filePath);
});

module.exports = routes;
