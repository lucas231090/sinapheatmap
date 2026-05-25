const fs = require("fs");
const path = require("path");
const { Router } = require("express");
const routeAdapter = require("./routeAdapter");
const authMiddleware = require("../middlewares/auth");
const SignInController = require("../controllers/SignInController");
const SignUpController = require("../controllers/SignUpController");
const GetMeController = require("../controllers/GetMeController");
const EyeTrackingController = require("../controllers/EyeTrackingController");
const HeatMapController = require("../controllers/HeatMapController");
const { uploadsMediaDir } = require("../configs/uploadsPaths");

const routes = Router();

// ─── Rotas Públicas (não requerem autenticação) ───────────────────────────────
routes.post("/sign-in", routeAdapter(SignInController));
routes.post("/sign-up", routeAdapter(SignUpController));

// Leitura de experimentos: pública para que a visualização de heatmap funcione sem login
routes.get("/eyetracking", EyeTrackingController.index);
routes.get("/eyetracking/:_id", EyeTrackingController.show);
routes.get("/eyetracking/public/:_id", EyeTrackingController.publicShow);
routes.post("/eyetracking", EyeTrackingController.store);
routes.post("/eyetracking/sessions", EyeTrackingController.storeSession);
routes.get("/eyetracking/:_id/sessions", EyeTrackingController.getSessions);

// Servir arquivos de mídia: público para que a visualização do heatmap carregue a imagem/vídeo
routes.get("/uploads/media/:filename", (req, res) => {
  const requested = req.params.filename;
  const safeName = path.basename(requested);

  if (safeName !== requested) {
    return res.status(400).send("Invalid filename");
  }

  const filePath = path.join(uploadsMediaDir, safeName);

  console.info("/uploads/media request for:", { requested, filePath });

  try {
    if (!fs.existsSync(filePath)) {
      console.warn("Requested media not found:", filePath);
      return res.status(404).send("Not found");
    }

    return res.sendFile(filePath);
  } catch (err) {
    console.error(
      "Error serving media file:",
      filePath,
      err.stack || err.message,
    );
    return res.status(500).send("Error serving media");
  }
});

// ─── Middleware de Autenticação ───────────────────────────────────────────────
// Todas as rotas definidas ABAIXO desta linha requerem um token JWT válido no header:
// Authorization: Bearer <token>
routes.use(authMiddleware);

// ─── Rotas Protegidas ─────────────────────────────────────────────────────────
routes.get("/me", routeAdapter(GetMeController));
routes.post("/eyetracking/media", EyeTrackingController.uploadMedia);
routes.post("/heatmap", HeatMapController.store);
routes.put("/heatmap/:id", HeatMapController.update);
routes.put("/eyetracking/:_id", EyeTrackingController.updateActiveStatus);
routes.delete("/eyetracking/:_id", EyeTrackingController.delete);

module.exports = routes;
