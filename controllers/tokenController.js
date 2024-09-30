const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken"); // Ajuste o caminho conforme necessário

exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Refresh token não fornecido" });
  }

  try {
    const refreshToken = await RefreshToken.findOne({ token });
    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh token inválido" });
    }

    // Verifica se o refresh token é válido
    jwt.verify(token, process.env.REFRESH_TOKEN, async (err, user) => {
      if (err) {
        return res.sendStatus(403); // Token inválido
      }

      // Gera um novo access token
      const newAccessToken = jwt.sign(
        { userId: user.userId },
        process.env.SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao renovar o token" });
  }
};
