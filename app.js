/* imports */
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

/* variables */
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const refresh_token = process.env.REFRESH_TOKEN;

/* app config */
const app = express();

//Middleware
app.use(express.json());

//Models
const User = require("./models/User");

//Credentials
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
  .connect(
    // console.log(dbUser, dbPassword),
    `mongodb+srv://${dbUser}:${dbPassword}@jwt.uhtowq0.mongodb.net/?retryWrites=true&w=majority&appName=JWT`
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

//Login Schema
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res
      .status(422)
      .json({ Erro: "Porfavor, preencha todos os campos..." });
  }

  // User check
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(422).json({ Erro: "Usuario nao encontrado" });
  }

  // Password check
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(422).json({ Erro: "Senha incorreta..." });
  }

  try {
    const secret = process.env.SECRET;
    const token = jwt.sign({ userId: user._id }, secret);

    // Return token and message in the response body
    return res
      .status(200)
      .json({ token: token, message: "Login efetuado com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao efetuar login" });
  }
});

// Register Schema
app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  //validation
  if (!name || !email || !password || !confirmpassword) {
    return res
      .status(422)
      .json({ Erro: "Porfavor, preencha todos os campos..." });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ Erro: "As senhas não são iguais..." });
  }

  //usuario checagem
  const userExist = await User.findOne({ email: email });

  if (userExist) {
    return res.status(422).json({ Erro: "Email já cadastrado..." });
  }

  //senha metodo
  const salt = await bcrypt.genSalt(10);
  console.log("bate aq", salt);
  const hashPassword = await bcrypt.hash(password, salt);

  //salvar usuario
  const user = new User({
    name,
    email,
    password: hashPassword,
    uploadCount: 3, // Definir valor inicial aqui, se necessário
  });

  try {
    await user.save();
    res.status(201).json({ message: "Usuario registrado com sucesso..." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
});

app.listen(3000, () => console.log("Server is running"));
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World" });
  // res.send("Hello World");
});

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

oauth2Client.setCredentials({ refresh_token: refresh_token });

const drive = google.drive({ version: "v3", auth: oauth2Client });

const filePath = path.resolve(__dirname, "teste.png");

fs.access(filePath, fs.constants.F_OK, (err) => {
  console.log(`${filePath} ${err ? "não existe" : "existe"}`);
});

async function uploadFile(fileName, filePath) {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: "image/png",
      },
      media: {
        mimeType: "image/png",
        body: fs.createReadStream(filePath),
      },
    });

    console.log("Upload bem-sucedido:", response.data);
    return response.data;
  } catch (err) {
    console.log("Erro para dar upload na imagem", err);
    throw err;
  }
}
// uploadFile();

async function deleteFile() {
  try {
    const response = await drive.files.delete({
      fileId: "1InU48x8Lry1pO_KlLrgSKPc6zOG2B9Ac",
    });
    console.log(response.data, "deletado");
  } catch (err) {
    console.log("Erro para deletar imagem", err);
  }
}

// deleteFile();

async function generatePublicUrl() {
  try {
    const fileId = "1Zuqb9oxFw8HKPyfXTSsakA4700agdudF";
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const result = await drive.files.get({
      fileId: fileId,
      fields: "webViewLink, webContentLink",
    });

    console.log(result.data);
  } catch (err) {
    console.log("Erro para gerar url publica", err);
  }
}

// generatePublicUrl();

//private route

app.get("/auth/user/:id", checkToken, async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ Erro: "ID inválido" });
  }

  try {
    const user = await User.findById(id, "-password");
    if (!user) {
      return res.status(422).json({ Erro: "Usuario não encontrado" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ Erro: "Erro ao buscar usuário" });
  }
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ Erro: "Acesso negado" });
  }

  try {
    const secret = process.env.SECRET;
    const verified = jwt.verify(token, secret);
    req.userId = verified.userId; // Adiciona o userId ao objeto req
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Erro: "Erro ao verificar token" });
  }
}

app.post("/upload", checkToken, async (req, res) => {
  const userId = req.userId; // ID do usuário extraído pelo middleware checkToken
  const { fileName, filePath } = req.body; // Supondo que o nome e caminho do arquivo sejam passados no corpo da requisição

  try {
    const user = await User.findById(userId);

    if (user.uploadCount > 0) {
      // Permitir upload e chamar a função uploadFile
      const uploadResponse = await uploadFile(fileName, filePath);

      // Diminuir o contador de uploads
      user.uploadCount -= 1;
      await user.save();

      res.status(200).json({
        message: "Upload realizado com sucesso",
        uploadsRestantes: user.uploadCount,
        uploadInfo: uploadResponse,
      });
    } else {
      res.status(403).json({ Erro: "Limite de uploads atingido" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ Erro: "Erro ao processar o upload" });
  }
});
