const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken"); // Ajuste o caminho conforme necessário

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token não fornecido" });
  }

  try {
    const refreshTokenDoc = await RefreshToken.findOne({ token: refreshToken });
    if (!refreshTokenDoc) {
      return res.status(403).json({ message: "Refresh token inválido" });
    }

    // Verifica se o refresh token é válido
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, async (err, user) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Refresh token inválido ou expirado" });
      }

      // Gera um novo access token
      const newAccessToken = jwt.sign(
        { userId: user.userId },
        process.env.SECRET,
        { expiresIn: "2m" }
      );

      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao renovar o token" });
  }
};
