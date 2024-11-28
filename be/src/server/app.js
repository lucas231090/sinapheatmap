const express = require("express");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const path = require("path");

const routes = require("../app/routes/routes");
const swaggerDocs = require("../swagger.json");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(
  "/uploads/media",
  express.static(path.join(__dirname, "uploads", "media"))
);

app.get("/", (request, response) => {
  response
    .status(200)
    .sendFile(path.join(__dirname + "/../../public/pages/index.html"));
});

app.use(routes);

module.exports = app;
