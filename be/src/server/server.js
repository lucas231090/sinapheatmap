require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");

const MESSAGE_SERVER = "API ON-LINE NA PORTA: ";

if (!process.env.PORT) {
  console.error("ERRO: PORT não está definida!");
  process.exit(1);
}
const PORT = process.env.PORT;

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

mongoose.connection
  .on("error", console.error.bind(console, "Erro na conexão com o MongoDB:"))
  .once("open", function () {
    console.log("Conexão MongoDB estabelecida com sucesso!");
  });

const server = http.createServer(app);

// Rota de healthcheck usada pelo Docker para verificar se o servidor está rodando
app.get("/health", (request, response) => {
  response.status(200).json({ status: "ok" });
});

server.listen(PORT, () => {
  console.log(MESSAGE_SERVER + PORT);
});
