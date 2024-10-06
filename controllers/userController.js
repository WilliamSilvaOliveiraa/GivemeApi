const User = require("../models/User");
const mongoose = require("mongoose");

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  // console.log("ID recebido:", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ Erro: "ID inválido" });
  }

  try {
    const user = await User.findById(id, "-password");
    if (!user) {
      return res.status(422).json({ Erro: "Usuário não encontrado" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ Erro: "Erro ao buscar usuário" });
  }
};
