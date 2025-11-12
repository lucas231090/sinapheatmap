require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");

const MESSAGE_SERVER = "API ON-LINE EM: ";
const PORT = process.env.PORT || 3333;
const HOST = `http://localhost:${PORT}`;

// Verificar se as variáveis de ambiente estão carregadas
if (!process.env.MONGO_URL) {
  console.error("ERRO: MONGO_URL não está definida!");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("ERRO: JWT_SECRET não está definida!");
  process.exit(1);
}

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
