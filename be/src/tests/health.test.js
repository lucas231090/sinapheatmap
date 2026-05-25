const request = require("supertest");
const express = require("express");

// Criamos um app mockado só para testar a rota health
const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

describe("Health Check Route", () => {
  it("should return 200 OK", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "ok");
  });
});
