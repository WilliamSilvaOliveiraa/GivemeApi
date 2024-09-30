const jwt = require("jsonwebtoken");
require("dotenv").config();

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ erro: "Acesso negado" });
  }

  try {
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error(err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ erro: "Token expirado", expired: true });
    }
    return res.status(403).json({ erro: "Token inválido" });
  }
}

module.exports = { checkToken };
