const express = require("express");
const router = express.Router();
const { getAuthUrl, handleCallback } = require("../config/googleConfig");

// Rota para obter a URL de autorização
router.post("/getAuthUrl", (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Erro ao gerar URL de autenticação:", error);
    res.status(500).json({ error: "Erro ao gerar URL de autenticação" });
  }
});

// Rota para lidar com o callback
router.post("/handleCallback", async (req, res) => {
  try {
    const { code } = req.body;
    const refreshToken = await handleCallback(code);
    res.json({ refreshToken });
  } catch (error) {
    console.error("Erro no callback:", error);
    res.status(500).json({ error: "Erro na autenticação" });
  }
});

module.exports = router;
