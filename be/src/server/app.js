const express = require("express");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const path = require("path");

const routes = require("../app/routes/routes");
const swaggerDocs = require("../swagger.json");

const app = express();

// Configura CORS: defina ALLOWED_ORIGINS no .env para restringir origens em produção
// Exemplo: ALLOWED_ORIGINS=https://seuapp.com,https://www.seuapp.com
// Em desenvolvimento, aceita qualquer origem local automaticamente
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3000", "http://localhost:5173"],
  }),
);

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get("/", (request, response) => {
  response
    .status(200)
    .sendFile(path.join(__dirname + "/../../public/pages/index.html"));
});

app.use(routes);

module.exports = app;
