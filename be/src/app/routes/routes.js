const path = require("path");
const { Router } = require("express");
const routeAdapter = require("./routeAdapter");
const authMiddleware = require("../middlewares/auth");
const SignInController = require("../controllers/SignInController");
const SignUpController = require("../controllers/SignUpController");
const EyeTrackingController = require("../controllers/EyeTrackingController");
const HeatMapController = require("../controllers/HeatMapController");

const routes = Router();

// ─── Rotas Públicas (não requerem autenticação) ───────────────────────────────
routes.post("/sign-in", routeAdapter(SignInController));
routes.post("/sign-up", routeAdapter(SignUpController));

// Leitura de experimentos: pública para que a visualização de heatmap funcione sem login
routes.get("/eyetracking", EyeTrackingController.index);
routes.get("/eyetracking/:_id", EyeTrackingController.show);

// Servir arquivos de mídia: público para que a visualização do heatmap carregue a imagem/vídeo
routes.get("/uploads/media/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "../uploads/media",
    req.params.filename,
  );
  res.sendFile(filePath);
});

// ─── Middleware de Autenticação ───────────────────────────────────────────────
// Todas as rotas definidas ABAIXO desta linha requerem um token JWT válido no header:
// Authorization: Bearer <token>
routes.use(authMiddleware);

// ─── Rotas Protegidas ─────────────────────────────────────────────────────────
routes.post("/heatmap", HeatMapController.store);
routes.put("/heatmap/:id", HeatMapController.update);
routes.put("/eyetracking/:_id", EyeTrackingController.updateActiveStatus);

module.exports = routes;
