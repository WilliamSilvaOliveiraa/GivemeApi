const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken"); // Adicione esta linha

if (!process.env.SECRET || !process.env.REFRESH_TOKEN) {
  console.error(
    "As variáveis de ambiente SECRET e REFRESH_TOKEN_SECRET devem ser definidas"
  );
  process.exit(1);
}

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(422)
      .json({ erro: "Por favor, preencha todos os campos..." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(422).json({ erro: "Usuário não encontrado" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(422).json({ erro: "Senha incorreta..." });
  }

  try {
    const accessToken = jwt.sign({ userId: user._id }, process.env.SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    // Salvar o refresh token no banco de dados
    await RefreshToken.create({ token: refreshToken, user: user._id });

    return res.status(200).json({
      accessToken,
      refreshToken,
      message: "Login efetuado com sucesso",
    });
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
      .json({ erro: "Por favor, preencha todos os campos..." });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ erro: "As senhas não são iguais..." });
  }

  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(422).json({ erro: "Email já cadastrado..." });
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
    console.error(err);
    res.status(500).json({ message: "Erro ao registrar usuário" });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token é necessário" });
  }

  try {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
    res.status(200).json({ message: "Logout realizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao realizar logout" });
  }
};
