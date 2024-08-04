const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(422)
      .json({ Erro: "Por favor, preencha todos os campos..." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(422).json({ Erro: "Usuário não encontrado" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(422).json({ Erro: "Senha incorreta..." });
  }

  try {
    const token = jwt.sign({ userId: user._id }, process.env.SECRET);
    return res
      .status(200)
      .json({ token, message: "Login efetuado com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao efetuar login" });
  }
};

exports.register = async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  if (!name || !email || !password || !confirmpassword) {
    return res
      .status(422)
      .json({ Erro: "Por favor, preencha todos os campos..." });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ Erro: "As senhas não são iguais..." });
  }

  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(422).json({ Erro: "Email já cadastrado..." });
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    password: hashPassword,
    uploadCount: 3,
  });

  try {
    await user.save();
    res.status(201).json({ message: "Usuário registrado com sucesso..." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
};
