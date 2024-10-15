const express = require("express");
const router = express.Router();
const { getAuthUrl, handleCallback } = require("../config/googleConfig");

router.post("/getAuthUrl", (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Erro ao gerar URL de autenticação:", error);
    res.status(500).json({ error: "Erro ao gerar URL de autenticação" });
  }
});

router.post("/handleCallback", async (req, res) => {
  console.log("Corpo da requisição recebida:", req.body);
  try {
    const { code } = req.body;
    if (!code) {
      return res
        .status(400)
        .json({ error: "Código de autorização não fornecido" });
    }
    const tokens = await handleCallback(code);
    res.json(tokens);
  } catch (error) {
    console.error("Erro no callback:", error);
    res
      .status(500)
      .json({ error: "Erro na autenticação", details: error.message });
  }
});

module.exports = router;
