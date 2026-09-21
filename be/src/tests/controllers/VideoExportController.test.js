const VideoExportController = require("../../app/controllers/VideoExportController");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

jest.mock("@remotion/bundler");
jest.mock("@remotion/renderer");
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  unlink: jest.fn((path, cb) => cb(null)),
}));

describe("VideoExportController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if coords or canvasSize are missing", async () => {
    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await VideoExportController.export(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Parâmetros de rastreamento inválidos." });
  });

  it("should process valid payload and download file", async () => {
    const req = {
      body: {
        coords: [{ x: 10, y: 10, ts: 100 }],
        canvasSize: { width: 1920, height: 1080 },
        exposureSeconds: 5,
        mediaUrl: "video.mp4"
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: jest.fn((path, name, cb) => cb(null)),
    };

    bundle.mockResolvedValue("mocked-bundle-url");
    selectComposition.mockResolvedValue("mocked-composition");
    renderMedia.mockResolvedValue();

    await VideoExportController.export(req, res);

    expect(bundle).toHaveBeenCalled();
    expect(selectComposition).toHaveBeenCalled();
    expect(renderMedia).toHaveBeenCalled();
    expect(res.download).toHaveBeenCalled();
  });

  it("should return 500 if remotion fails", async () => {
    const req = {
      body: {
        coords: [{ x: 10, y: 10, ts: 100 }],
        canvasSize: { width: 1920, height: 1080 },
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    selectComposition.mockRejectedValue(new Error("Remotion failed"));

    await VideoExportController.export(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Falha na renderização do vídeo.",
      details: "Remotion failed",
    });
  });
});
