const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const dns = require("dns");
const { promisify } = require("util");
const resolveMx = promisify(dns.resolveMx);

if (!process.env.SECRET || !process.env.REFRESH_TOKEN) {
  console.error(
    "As variáveis de ambiente SECRET e REFRESH_TOKEN_SECRET devem ser definidas"
  );
  process.exit(1);
}

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ erro: "Please fill in all fields..." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(422).json({ erro: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(422).json({ erro: "Incorrect password..." });
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
      userId: user._id,
      accessToken,
      refreshToken,
      message: "Login successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error when logging in" });
  }
};

exports.register = async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  if (!name || !email || !password || !confirmpassword) {
    return res.status(422).json({ erro: "Please fill in all fields..." });
  }

  // Validação básica de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(422).json({ erro: "Invalid email format." });
  }

  if (password !== confirmpassword) {
    return res.status(422).json({ erro: "The passwords are not the same..." });
  }

  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(422).json({ erro: "Email already registered..." });
  }

  // Verificação de domínio MX
  try {
    const domain = email.split("@")[1];
    const mxRecords = await resolveMx(domain);
    if (mxRecords.length === 0) {
      return res.status(422).json({ erro: "Invalid email domain." });
    }
  } catch (error) {
    // console.error("Erro ao verificar domínio MX:", error);
    return res.status(422).json({ erro: "Unable to verify email domain." });
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
    const savedUser = await user.save();

    // Gerar tokens de acesso e atualização
    const accessToken = jwt.sign(
      { userId: savedUser._id },
      process.env.SECRET,
      {
        expiresIn: "15m",
      }
    );
    const refreshToken = jwt.sign(
      { userId: savedUser._id },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    // Salvar o refresh token no banco de dados
    await RefreshToken.create({ token: refreshToken, user: savedUser._id });

    res.status(201).json({
      message: "User registered successfully...",
      userId: savedUser._id,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering user" });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
    res.status(200).json({ message: "Logout completed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error when logging out" });
  }
};
