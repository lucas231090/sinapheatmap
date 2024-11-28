require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");

const MESSAGE_SERVER = "API ON-LINE EM: ";
const PORT = 3333;
const HOST = `http://localhost:${PORT}`;

mongoose.connect(process.env.MONGO_URL);
//mongoose.connect('mongodb://localhost:27017/sinapsense');

mongoose.connection
  .on("error", console.error.bind(console, "Erro na conexão com o MongoDB:"))
  .once("open", function () {
    console.log("Conexão MongoDB estabelecida com sucesso!");
  });

const server = http.createServer(app);
app.get("/server", (request, response) => {
  const sv = server;
  response.send(sv);
});

server.listen(PORT, () => {
  console.log(MESSAGE_SERVER + HOST);
});
