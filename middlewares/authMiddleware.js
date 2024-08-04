const jwt = require("jsonwebtoken");
require("dotenv").config();

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ Erro: "Acesso negado" });
  }

  try {
    const secret = process.env.SECRET;
    const verified = jwt.verify(token, secret);
    req.userId = verified.userId;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Erro: "Erro ao verificar token" });
  }
}

module.exports = { checkToken };
